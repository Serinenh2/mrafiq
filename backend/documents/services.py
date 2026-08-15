"""Fusion des modèles Word avec les informations de l'entreprise (§18/§41)."""
import io
import shutil
from docx import Document as DocxDocument
from docx.oxml.ns import qn
from docx.table import Table
from docx.text.paragraph import Paragraph

TOKEN = 'اسم الهيئة'

def _replace_in_paragraph(paragraph, replacement):
    """Remplace le jeton même s'il est réparti entre plusieurs runs Word
    (fréquent avec le texte arabe) : on retravaille au niveau du paragraphe
    plutôt que run par run."""
    if TOKEN not in paragraph.text or not paragraph.runs:
        return
    new_text = paragraph.text.replace(TOKEN, replacement)
    paragraph.runs[0].text = new_text
    for run in paragraph.runs[1:]:
        run.text = ''

def merge_docx(source_path, company_name):
    """Retourne un buffer .docx avec le nom de l'entreprise injecté."""
    doc = DocxDocument(source_path)
    for paragraph in doc.paragraphs:
        _replace_in_paragraph(paragraph, company_name)
    for table in doc.tables:
        for row in table.rows:
            for cell in row.cells:
                for paragraph in cell.paragraphs:
                    _replace_in_paragraph(paragraph, company_name)
    buf = io.BytesIO()
    doc.save(buf)
    buf.seek(0)
    return buf

def preview_payload(path):
    """Structure de blocs en lecture seule pour afficher un aperçu dans l'app (§18)."""
    path = str(path)
    if path.lower().endswith('.pdf'):
        return {'type': 'pdf'}
    doc = DocxDocument(path)
    blocks = []
    for child in doc.element.body.iterchildren():
        if child.tag == qn('w:p'):
            p = Paragraph(child, doc)
            if not p.text.strip():
                continue
            heading = p.style.name.startswith(('Heading', 'Title')) or \
                (bool(p.runs) and all(r.bold for r in p.runs))
            blocks.append({'type': 'heading' if heading else 'paragraph', 'text': p.text})
        elif child.tag == qn('w:tbl'):
            tbl = Table(child, doc)
            rows = [[cell.text for cell in row.cells] for row in tbl.rows]
            if any(any(c.strip() for c in r) for r in rows):
                blocks.append({'type': 'table', 'rows': rows})
    return {'type': 'docx', 'blocks': blocks}

def copy_as_is(source_path):
    """Pour les modèles non fusionnables (blancs manuscrits, PDF) : copie brute."""
    buf = io.BytesIO()
    with open(source_path, 'rb') as f:
        shutil.copyfileobj(f, buf)
    buf.seek(0)
    return buf
