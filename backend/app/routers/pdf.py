from fastapi import APIRouter, UploadFile, File, Form, HTTPException, BackgroundTasks
from fastapi.responses import FileResponse
from typing import List
import fitz
import os
from app.utils.file_helpers import create_temp_file, cleanup_files, get_safe_filename

router = APIRouter()

MAX_FILE_SIZE = 50 * 1024 * 1024

def check_file_size(content: bytes):
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="File too large. Maximum size is 50MB.")


@router.post("/merge")
async def merge_pdfs(background_tasks: BackgroundTasks, files: List[UploadFile] = File(...)):
    if len(files) < 2:
        raise HTTPException(status_code=400, detail="Please upload at least 2 PDF files")

    input_paths = []
    output_path = create_temp_file(".pdf")

    try:
        for file in files:
            content = await file.read()
            check_file_size(content)
            tmp = create_temp_file(".pdf")
            with open(tmp, "wb") as f:
                f.write(content)
            input_paths.append(tmp)

        merged = fitz.open()
        for path in input_paths:
            doc = fitz.open(path)
            merged.insert_pdf(doc)
            doc.close()

        merged.save(output_path)
        merged.close()

        background_tasks.add_task(cleanup_files, output_path, *input_paths)

        return FileResponse(
            output_path,
            media_type="application/pdf",
            filename="merged.pdf"
        )
    except HTTPException:
        cleanup_files(output_path, *input_paths)
        raise
    except Exception as e:
        cleanup_files(output_path, *input_paths)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/split")
async def split_pdf(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    start_page: int = Form(1),
    end_page: int = Form(None)
):
    input_path = create_temp_file(".pdf")
    output_path = create_temp_file(".pdf")

    try:
        content = await file.read()
        check_file_size(content)
        with open(input_path, "wb") as f:
            f.write(content)

        doc = fitz.open(input_path)
        total_pages = len(doc)

        start = max(0, start_page - 1)
        end = min(total_pages, end_page if end_page else total_pages)

        new_doc = fitz.open()
        new_doc.insert_pdf(doc, from_page=start, to_page=end - 1)
        new_doc.save(output_path)
        new_doc.close()
        doc.close()

        filename = f"{get_safe_filename(file.filename)}_pages_{start_page}_to_{end}.pdf"

        background_tasks.add_task(cleanup_files, input_path, output_path)

        return FileResponse(
            output_path,
            media_type="application/pdf",
            filename=filename
        )
    except HTTPException:
        cleanup_files(input_path, output_path)
        raise
    except Exception as e:
        cleanup_files(input_path, output_path)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/compress")
async def compress_pdf(background_tasks: BackgroundTasks, file: UploadFile = File(...)):
    input_path = create_temp_file(".pdf")
    output_path = create_temp_file(".pdf")

    try:
        content = await file.read()
        check_file_size(content)
        with open(input_path, "wb") as f:
            f.write(content)

        doc = fitz.open(input_path)
        doc.save(output_path, garbage=4, deflate=True, clean=True)
        doc.close()

        original_size = os.path.getsize(input_path)
        compressed_size = os.path.getsize(output_path)
        filename = f"{get_safe_filename(file.filename)}_compressed.pdf"

        background_tasks.add_task(cleanup_files, input_path, output_path)

        return FileResponse(
            output_path,
            media_type="application/pdf",
            filename=filename,
            headers={"X-Original-Size": str(original_size), "X-Compressed-Size": str(compressed_size)}
        )
    except HTTPException:
        cleanup_files(input_path, output_path)
        raise
    except Exception as e:
        cleanup_files(input_path, output_path)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/images-to-pdf")
async def images_to_pdf(background_tasks: BackgroundTasks, files: List[UploadFile] = File(...)):
    if not files:
        raise HTTPException(status_code=400, detail="Please upload at least one image")

    input_paths = []
    output_path = create_temp_file(".pdf")

    try:
        for file in files:
            ext = os.path.splitext(file.filename)[1].lower()
            if ext not in [".jpg", ".jpeg", ".png", ".webp"]:
                raise HTTPException(status_code=400, detail=f"Unsupported image format: {ext}")
            content = await file.read()
            check_file_size(content)
            tmp = create_temp_file(ext)
            with open(tmp, "wb") as f:
                f.write(content)
            input_paths.append(tmp)

        doc = fitz.open()
        for path in input_paths:
            img = fitz.open(path)
            pdf_bytes = img.convert_to_pdf()
            img.close()
            img_pdf = fitz.open("pdf", pdf_bytes)
            doc.insert_pdf(img_pdf)

        doc.save(output_path)
        doc.close()

        background_tasks.add_task(cleanup_files, output_path, *input_paths)

        return FileResponse(
            output_path,
            media_type="application/pdf",
            filename="images.pdf"
        )
    except HTTPException:
        cleanup_files(output_path, *input_paths)
        raise
    except Exception as e:
        cleanup_files(output_path, *input_paths)
        raise HTTPException(status_code=500, detail=str(e))