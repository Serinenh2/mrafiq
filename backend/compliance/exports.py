"""Exports : registre Excel (§14/§39) et rapport de diagnostic PDF (§23)."""
import io
from datetime import date
from django.http import HttpResponse
from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Alignment
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm
from reportlab.platypus import (SimpleDocTemplate, Paragraph, Spacer, Table,
                                TableStyle, HRFlowable)
from .services import company_score

INK = colors.HexColor('#0B2545'); PRIMARY = colors.HexColor('#1B5CB4')
BRASS = colors.HexColor('#B08A3C')

def registre_xlsx(company):
    wb = Workbook(); ws = wb.active; ws.title = 'Registre'
    headers = ['Réf.', 'Traitement', 'Responsable', 'Service', 'Finalité', 'Personnes',
               'Données', 'Destinataires', 'Conservation', 'Sous-traitants',
               'Transfert étranger', 'Statut', 'Conformité (%)']
    ws.append(headers)
    fill = PatternFill('solid', fgColor='0B2545')
    for c in ws[1]:
        c.font = Font(bold=True, color='FFFFFF'); c.fill = fill
        c.alignment = Alignment(vertical='center')
    for p in company.processings.exclude(status='rejete'):
        vals = {'conforme':100,'partiel':50,'non_conforme':0,'manquant':0}
        pts = [vals[a.status] for a in p.assessments.all() if a.status in vals]
        ws.append([
            p.reference, p.name, p.owner_name, p.department, p.purpose,
            ', '.join(s.label_fr for s in p.subject_categories.all()),
            ', '.join(d.label_fr for d in p.data_categories.all()),
            p.recipients,
            p.retention_duration,
            ', '.join(pr.name for pr in p.processors.all()),
            'Oui' if p.transfer_abroad else 'Non',
            p.get_status_display(),
            round(sum(pts)/len(pts)) if pts else '',
        ])
    for i, w in enumerate([10,26,18,16,34,24,28,24,16,22,14,14,12], start=1):
        ws.column_dimensions[ws.cell(row=1, column=i).column_letter].width = w
    buf = io.BytesIO(); wb.save(buf); buf.seek(0)
    resp = HttpResponse(buf.read(),
        content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    resp['Content-Disposition'] = f'attachment; filename="registre_{company.pk}.xlsx"'
    return resp

def diagnostic_pdf(company):
    buf = io.BytesIO()
    doc = SimpleDocTemplate(buf, pagesize=A4, topMargin=18*mm, bottomMargin=18*mm)
    ss = getSampleStyleSheet()
    h1 = ParagraphStyle('h1', parent=ss['Title'], textColor=INK, fontSize=20, spaceAfter=2)
    sub = ParagraphStyle('sub', parent=ss['Normal'], textColor=BRASS, fontSize=9, spaceAfter=14)
    h2 = ParagraphStyle('h2', parent=ss['Heading2'], textColor=PRIMARY, fontSize=13, spaceBefore=14)
    body = ss['BodyText']
    score = company_score(company)
    story = [
        Paragraph('MRAFIQ — Rapport de diagnostic de conformité', h1),
        Paragraph(f'{company.name} · {date.today().strftime("%d/%m/%Y")} · Loi n° 18-07', sub),
        HRFlowable(width='100%', color=BRASS, thickness=2), Spacer(1, 6),
        Paragraph('1. Synthèse exécutive', h2),
    ]
    if score['global'] is not None:
        story.append(Paragraph(
            f"Score global de conformité : <b>{score['global']} %</b> — niveau "
            f"<b>{score['level']['fr']}</b>. Ce score agrège l'évaluation des exigences "
            f"configurées dans le référentiel juridique, pondérées par domaine.", body))
    else:
        story.append(Paragraph("Aucune évaluation disponible : lancer le moteur de conformité.", body))

    story.append(Paragraph('2. Score par domaine', h2))
    rows = [['Domaine', 'Poids', 'Score']]
    for d in score['domains']:
        rows.append([d['label_fr'], str(d['weight']),
                     f"{d['score']} %" if d['score'] is not None else '—'])
    t = Table(rows, colWidths=[95*mm, 25*mm, 30*mm])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), INK), ('TEXTCOLOR', (0,0), (-1,0), colors.white),
        ('FONTSIZE', (0,0), (-1,-1), 9), ('GRID', (0,0), (-1,-1), .4, colors.HexColor('#C6D1E0')),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor('#F5F7FB')]),
        ('TOPPADDING', (0,0), (-1,-1), 5), ('BOTTOMPADDING', (0,0), (-1,-1), 5)]))
    story.append(t)

    story.append(Paragraph('3. Principaux écarts', h2))
    rows = [['Réf. traitement', 'Exigence', 'Gravité', 'Description']]
    for g in company.gaps.filter(is_open=True).select_related('processing','requirement')[:20]:
        rows.append([g.processing.reference if g.processing else '—',
                     g.requirement.code if g.requirement else '—',
                     g.get_severity_display(), Paragraph(g.description, ss['BodyText'])])
    if len(rows) == 1: rows.append(['—','—','—','Aucun écart ouvert.'])
    t = Table(rows, colWidths=[26*mm, 22*mm, 20*mm, 82*mm])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), PRIMARY), ('TEXTCOLOR', (0,0), (-1,0), colors.white),
        ('FONTSIZE', (0,0), (-1,-1), 8.5), ('GRID', (0,0), (-1,-1), .4, colors.HexColor('#C6D1E0')),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('TOPPADDING', (0,0), (-1,-1), 4), ('BOTTOMPADDING', (0,0), (-1,-1), 4)]))
    story.append(t)

    story.append(Paragraph('4. Actions prioritaires', h2))
    for a in company.actions.exclude(status__in=['termine','valide']).order_by('due_date')[:10]:
        story.append(Paragraph(
            f"<b>{a.reference}</b> — {a.title} · priorité {a.get_priority_display() if hasattr(a,'get_priority_display') else a.priority}"
            f"{' · échéance ' + a.due_date.strftime('%d/%m/%Y') if a.due_date else ''}", body))

    story.append(Spacer(1, 12))
    story.append(Paragraph(
        "Document préparé via la plateforme MRAFIQ à des fins d'accompagnement. "
        "Il ne constitue ni une décision ni une autorisation d'une autorité administrative.",
        ParagraphStyle('foot', parent=ss['Normal'], fontSize=8, textColor=colors.HexColor('#51617A'))))
    doc.build(story)
    buf.seek(0)
    resp = HttpResponse(buf.read(), content_type='application/pdf')
    resp['Content-Disposition'] = f'attachment; filename="rapport_diagnostic_{company.pk}.pdf"'
    return resp
