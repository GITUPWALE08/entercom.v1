from django.contrib import admin
from apps.requests.models.audit import Escalation, StateHistory
from apps.requests.models.assignment import Assignment
from apps.requests.models.quote import Quote
from apps.requests.models.request import Request
from apps.requests.models.verification import Verification, Evidence

admin.site.register([Assignment, Escalation, Evidence, Quote, Request, StateHistory, Verification])