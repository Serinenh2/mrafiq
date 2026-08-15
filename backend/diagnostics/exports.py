"""Impression du questionnaire — vierge ou rempli (§5)."""
import io
from datetime import date
from xml.sax.saxutils import escape as esc
from django.http import HttpResponse
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, HRFlowable
from compliance.exports import INK, PRIMARY, BRASS
from .models import Question


def _header(title, subtitle, ss):
    h1 = ParagraphStyle('h1', parent=ss['Title'], textColor=INK, fontSize=18, spaceAfter=2)
    sub = ParagraphStyle('sub', parent=ss['Normal'], textColor=BRASS, fontSize=9, spaceAfter=14)
    return [Paragraph(esc(title), h1), Paragraph(esc(subtitle), sub),
            HRFlowable(width='100%', color=BRASS, thickness=2), Spacer(1, 8)]


def blank_questionnaire_pdf():
    buf = io.BytesIO()
    doc = SimpleDocTemplate(buf, pagesize=A4, topMargin=18*mm, bottomMargin=18*mm)
    ss = getSampleStyleSheet()
    h3 = ParagraphStyle('h3', parent=ss['Heading3'], textColor=PRIMARY, fontSize=11,
                        spaceBefore=10, spaceAfter=2)
    body = ss['BodyText']
    why = ParagraphStyle('why', parent=ss['Normal'], fontSize=8.5,
                         textColor=colors.HexColor('#51617A'), spaceAfter=4)
    blank_line = ParagraphStyle('blank', parent=ss['Normal'], fontSize=9,
                                textColor=colors.HexColor('#8894A8'))

    story = _header('MRAFIQ — Questionnaire (vierge)',
        f'{date.today().strftime("%d/%m/%Y")} — à compléter pendant l\'entretien', ss)
    section = None
    for q in Question.objects.filter(active=True).order_by('order'):
        if q.section and q.section != section:
            section = q.section
            story.append(Paragraph(esc(section), h3))
        prefix = '' if q.is_root else '&#8618; '
        story.append(Paragraph(f'<b>{prefix}{esc(q.code)}.</b> {esc(q.text_fr)}', body))
        if q.rationale_fr:
            story.append(Paragraph(f'Pourquoi cette question&#8202;? {esc(q.rationale_fr)}', why))
        story.append(Paragraph(
            'Réponse : &#9744; Oui &#160;&#160;&#160; &#9744; Non &#160;&#160;&#160; Commentaire : '
            + '_' * 40, blank_line))
        story.append(Spacer(1, 6))
    doc.build(story)
    buf.seek(0)
    resp = HttpResponse(buf.read(), content_type='application/pdf')
    resp['Content-Disposition'] = 'attachment; filename="questionnaire_vierge.pdf"'
    return resp


def filled_questionnaire_pdf(diagnostic):
    from .services import visible_questions
    buf = io.BytesIO()
    doc = SimpleDocTemplate(buf, pagesize=A4, topMargin=18*mm, bottomMargin=18*mm)
    ss = getSampleStyleSheet()
    h3 = ParagraphStyle('h3', parent=ss['Heading3'], textColor=PRIMARY, fontSize=11,
                        spaceBefore=10, spaceAfter=2)
    body = ss['BodyText']
    answer_style = ParagraphStyle('answer', parent=ss['Normal'], fontSize=9.5, textColor=INK, spaceAfter=2)
    meta = ParagraphStyle('meta', parent=ss['Normal'], fontSize=8.5, textColor=colors.HexColor('#51617A'))

    bits = [diagnostic.company.name]
    if diagnostic.service: bits.append(diagnostic.service)
    if diagnostic.respondent_name: bits.append(diagnostic.respondent_name)
    story = _header('MRAFIQ — Questionnaire (rempli)',
        f'{" · ".join(bits)} — {date.today().strftime("%d/%m/%Y")}', ss)

    qs, answers = visible_questions(diagnostic)
    comments = {a.question.code: a.comment for a in diagnostic.answers.select_related('question')}
    section = None
    for q in qs:
        if q.section and q.section != section:
            section = q.section
            story.append(Paragraph(esc(section), h3))
        prefix = '' if q.is_root else '&#8618; '
        story.append(Paragraph(f'<b>{prefix}{esc(q.code)}.</b> {esc(q.text_fr)}', body))
        val = answers.get(q.code)
        story.append(Paragraph(f'Réponse : <b>{esc(val.capitalize()) if val else "—"}</b>', answer_style))
        if comments.get(q.code):
            story.append(Paragraph(f'Commentaire : {esc(comments[q.code])}', meta))
        story.append(Spacer(1, 5))
    doc.build(story)
    buf.seek(0)
    resp = HttpResponse(buf.read(), content_type='application/pdf')
    resp['Content-Disposition'] = f'attachment; filename="questionnaire_rempli_{diagnostic.pk}.pdf"'
    return resp
