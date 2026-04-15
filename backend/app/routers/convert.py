from fastapi import APIRouter, UploadFile, File, Form, HTTPException, BackgroundTasks
from fastapi.responses import FileResponse, StreamingResponse
from PIL import Image
import fitz
import os
import io
import sys
import zipfile
import subprocess
from docx import Document
from docx.shared import Pt
from app.utils.file_helpers import create_temp_file, cleanup_files, get_safe_filename

router = APIRouter()

MAX_FILE_SIZE = 50 * 1024 * 1024

def check_file_size(content: bytes):
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="File too large. Maximum size is 50MB.")

def get_libreoffice_path():
    if sys.platform == "win32":
        return r"C:\Program Files\LibreOffice\program\soffice.exe"
    return "soffice"


@router.post("/pdf-to-images")
async def pdf_to_images(background_tasks: BackgroundTasks, file: UploadFile = File(...)):
    input_path = create_temp_file(".pdf")

    try:
        content = await file.read()
        check_file_size(content)
        with open(input_path, "wb") as f:
            f.write(content)

        doc = fitz.open(input_path)
        zip_buffer = io.BytesIO()

        with zipfile.ZipFile(zip_buffer, "w", zipfile.ZIP_DEFLATED) as zip_file:
            for i, page in enumerate(doc):
                mat = fitz.Matrix(2, 2)
                pix = page.get_pixmap(matrix=mat)
                img_bytes = pix.tobytes("png")
                zip_file.writestr(f"page_{i + 1}.png", img_bytes)

        doc.close()
        zip_buffer.seek(0)
        filename = f"{get_safe_filename(file.filename)}_pages.zip"

        background_tasks.add_task(cleanup_files, input_path)

        return StreamingResponse(
            zip_buffer,
            media_type="application/zip",
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )
    except HTTPException:
        cleanup_files(input_path)
        raise
    except Exception as e:
        cleanup_files(input_path)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/word-to-pdf")
async def word_to_pdf(background_tasks: BackgroundTasks, file: UploadFile = File(...)):
    input_path = create_temp_file(".docx")
    output_dir = os.path.dirname(input_path)

    try:
        content = await file.read()
        check_file_size(content)
        with open(input_path, "wb") as f:
            f.write(content)

        result = subprocess.run([
            get_libreoffice_path(),
            "--headless",
            "--convert-to", "pdf",
            "--outdir", output_dir,
            input_path
        ], capture_output=True, text=True, timeout=30)

        if result.returncode != 0:
            raise HTTPException(status_code=500, detail=f"Conversion failed: {result.stderr}")

        output_path = input_path.replace(".docx", ".pdf")

        if not os.path.exists(output_path):
            raise HTTPException(status_code=500, detail="Output file not created")

        filename = f"{get_safe_filename(file.filename)}.pdf"

        background_tasks.add_task(cleanup_files, input_path, output_path)

        return FileResponse(
            output_path,
            media_type="application/pdf",
            filename=filename
        )
    except HTTPException:
        cleanup_files(input_path)
        raise
    except Exception as e:
        cleanup_files(input_path)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/pdf-to-word")
async def pdf_to_word(background_tasks: BackgroundTasks, file: UploadFile = File(...)):
    input_path = create_temp_file(".pdf")
    output_path = create_temp_file(".docx")

    try:
        content = await file.read()
        check_file_size(content)
        with open(input_path, "wb") as f:
            f.write(content)

        doc = fitz.open(input_path)
        word_doc = Document()

        for page_num, page in enumerate(doc):
            blocks = page.get_text("blocks")
            blocks.sort(key=lambda b: (b[1], b[0]))
            for block in blocks:
                text = block[4].strip()
                if text:
                    para = word_doc.add_paragraph(text)
                    para.style.font.size = Pt(11)
            if page_num < len(doc) - 1:
                word_doc.add_page_break()

        doc.close()
        word_doc.save(output_path)

        filename = f"{get_safe_filename(file.filename)}.docx"

        background_tasks.add_task(cleanup_files, input_path, output_path)

        return FileResponse(
            output_path,
            media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            filename=filename
        )
    except HTTPException:
        cleanup_files(input_path, output_path)
        raise
    except Exception as e:
        cleanup_files(input_path, output_path)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/rotate-pdf")
async def rotate_pdf(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    rotation: int = Form(90)
):
    if rotation not in [90, 180, 270]:
        raise HTTPException(status_code=400, detail="Rotation must be 90, 180 or 270 degrees")

    input_path = create_temp_file(".pdf")
    output_path = create_temp_file(".pdf")

    try:
        content = await file.read()
        check_file_size(content)
        with open(input_path, "wb") as f:
            f.write(content)

        doc = fitz.open(input_path)
        for page in doc:
            page.set_rotation(rotation)

        doc.save(output_path)
        doc.close()

        filename = f"{get_safe_filename(file.filename)}_rotated.pdf"

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


@router.post("/resize-image")
async def resize_image(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    width: int = Form(None),
    height: int = Form(None)
):
    if not width and not height:
        raise HTTPException(status_code=400, detail="Please provide at least a width or height")

    ext = os.path.splitext(file.filename)[1].lower()
    input_path = create_temp_file(ext)
    output_path = create_temp_file(ext)

    try:
        content = await file.read()
        check_file_size(content)
        with open(input_path, "wb") as f:
            f.write(content)

        img = Image.open(input_path)
        orig_width, orig_height = img.size

        if width and not height:
            ratio = width / orig_width
            height = int(orig_height * ratio)
        elif height and not width:
            ratio = height / orig_height
            width = int(orig_width * ratio)

        resized = img.resize((width, height), Image.LANCZOS)

        save_format = "JPEG" if ext in [".jpg", ".jpeg"] else ext[1:].upper()
        if resized.mode in ["RGBA", "P"] and save_format == "JPEG":
            resized = resized.convert("RGB")

        resized.save(output_path, format=save_format)

        filename = f"{get_safe_filename(file.filename)}_resized{ext}"

        background_tasks.add_task(cleanup_files, input_path, output_path)

        return FileResponse(
            output_path,
            media_type=f"image/{ext[1:]}",
            filename=filename
        )
    except HTTPException:
        cleanup_files(input_path, output_path)
        raise
    except Exception as e:
        cleanup_files(input_path, output_path)
        raise HTTPException(status_code=500, detail=str(e))