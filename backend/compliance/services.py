"""Moteur de conformité : évaluations, écarts, score global et par domaine (§15–§18)."""
from django.utils import timezone
from processing.models import ProcessingActivity
from .models import (Domain, Requirement, Assessment, Gap,
                     SystemSetting, DEFAULT_SCORE_LEVELS)

STATUS_POINTS = {'conforme': 100, 'partiel': 50, 'non_conforme': 0, 'manquant': 0}
SEVERITY_BY_STATUS = {'non_conforme': 'eleve', 'manquant': 'moyen', 'partiel': 'moyen'}

def run_engine(company, user=None):
    """Crée les évaluations manquantes (à vérifier) et les écarts pour les non-conformités."""
    created_assessments = 0
    processings = company.processings.exclude(status__in=['propose', 'rejete'])
    requirements = list(Requirement.objects.filter(active=True))
    for p in processings:
        existing = set(p.assessments.values_list('requirement_id', flat=True))
        Assessment.objects.bulk_create([
            Assessment(processing=p, requirement=r) for r in requirements if r.id not in existing])
        created_assessments += len(requirements) - len(existing)

    created_gaps = 0
    bad = Assessment.objects.filter(
        processing__company=company,
        status__in=['non_conforme', 'partiel', 'manquant']).select_related('requirement', 'processing')
    for a in bad:
        _, created = Gap.objects.get_or_create(
            company=company, processing=a.processing, requirement=a.requirement,
            is_open=True,
            defaults={'description': f'Exigence {a.requirement.code} : {a.get_status_display()}',
                      'severity': SEVERITY_BY_STATUS.get(a.status, 'moyen')})
        created_gaps += int(created)
    # clôture des écarts dont l'évaluation est redevenue conforme
    for g in Gap.objects.filter(company=company, is_open=True).select_related('requirement','processing'):
        if g.processing and g.requirement and Assessment.objects.filter(
                processing=g.processing, requirement=g.requirement, status='conforme').exists():
            g.is_open = False; g.save(update_fields=['is_open'])
    return {'assessments_created': created_assessments, 'gaps_created': created_gaps}

def score_level(score):
    levels = SystemSetting.get('score_levels', DEFAULT_SCORE_LEVELS)
    for lv in levels:
        if lv['min'] <= score <= lv['max']:
            return lv
    return levels[-1]

def company_score(company):
    """Score par domaine + global pondéré. Les 'à vérifier' sont exclus du calcul."""
    domains = []
    total_w, total_ws = 0, 0.0
    for d in Domain.objects.all():
        qs = Assessment.objects.filter(
            processing__company=company, requirement__domain=d
        ).exclude(status='a_verifier').exclude(processing__status__in=['propose','rejete'])
        points = [STATUS_POINTS[a.status] for a in qs]
        d_score = round(sum(points) / len(points)) if points else None
        domains.append({'code': d.code, 'label_fr': d.label_fr, 'label_ar': d.label_ar,
                        'weight': d.weight, 'score': d_score})
        if d_score is not None:
            total_w += d.weight
            total_ws += d.weight * d_score
    global_score = round(total_ws / total_w) if total_w else None
    return {
        'global': global_score,
        'level': score_level(global_score) if global_score is not None else None,
        'domains': domains,
    }
