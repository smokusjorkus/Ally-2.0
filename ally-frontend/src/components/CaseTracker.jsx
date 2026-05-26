import React from 'react';
import { AlertCircle, BriefcaseBusiness, CalendarDays, CheckCircle2, Clock3, FileText, Gavel, MapPin, MessageSquareText, XCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

const CaseTracker = ({ cases = [], selectedCaseId, onSelectCase, userRole }) => {
  const selectedCase = cases.find(caseItem => caseItem.caseId === Number(selectedCaseId)) || cases[0];

  if (!selectedCase) {
    return (
      <section id="case-tracker-panel" className="p-5 mb-6 border border-dashed border-gray-300 rounded-xl bg-gray-50">
        <div className="flex items-center gap-3 text-gray-600">
          <MapPin className="w-5 h-5" />
          <div>
            <h2 className="font-semibold text-gray-900">Case Tracker</h2>
            <p className="text-sm">Submit or receive a case to start tracking progress.</p>
          </div>
        </div>
      </section>
    );
  }

  const timeline = buildTrackerTimeline(selectedCase);
  const progress = getProgress(timeline);
  const nextAction = getNextAction(selectedCase, userRole);
  const participant = getParticipant(selectedCase, userRole);

  return (
    <section id="case-tracker-panel" className="p-5 mb-6 border border-blue-100 rounded-xl bg-blue-50/60">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm font-semibold text-blue-700">
            <MapPin className="w-4 h-4" />
            Case Tracker
          </div>
          <h2 className="mt-2 text-xl font-bold text-gray-900">
            {selectedCase.title || `Case #${selectedCase.caseId}`}
          </h2>
          <p className="mt-1 text-sm text-gray-600">
            Track the case from submission to closure using the current case status and workspace activity.
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <select
            value={selectedCase.caseId}
            onChange={(event) => onSelectCase?.(Number(event.target.value))}
            className="px-3 py-2 text-sm bg-white border border-blue-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          >
            {cases.map(caseItem => (
              <option key={caseItem.caseId} value={caseItem.caseId}>
                #{caseItem.caseId} - {caseItem.title || caseItem.caseType || 'Untitled case'}
              </option>
            ))}
          </select>

          {selectedCase.status === 'ACCEPTED' && (
            <Link
              to="/workspace"
              className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700"
            >
              <BriefcaseBusiness className="w-4 h-4" />
              Open Workspace
            </Link>
          )}
        </div>
      </div>

      <div className="grid gap-3 mt-5 md:grid-cols-2 xl:grid-cols-4">
        <TrackerTile icon={FileText} label="Case ID" value={`#${selectedCase.caseId}`} />
        <TrackerTile icon={Gavel} label="Case Type" value={selectedCase.caseType || 'General'} />
        <TrackerTile icon={CalendarDays} label="Submitted" value={formatDate(selectedCase.dateSubmitted)} />
        <TrackerTile icon={MessageSquareText} label={participant.label} value={participant.name} />
      </div>

      <div className="p-4 mt-5 bg-white border border-blue-100 rounded-lg">
        <div className="flex flex-col gap-2 mb-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Overall Progress</h3>
            <p className="text-xs text-gray-500">{progress.completed} of {timeline.length} milestones complete</p>
          </div>
          <span className={`self-start px-3 py-1 text-xs font-semibold rounded-full ${statusClass(selectedCase.status)}`}>
            {formatStatus(selectedCase.status)}
          </span>
        </div>

        <div className="h-2 overflow-hidden bg-gray-100 rounded-full">
          <div
            className="h-full bg-blue-600 rounded-full"
            style={{ width: `${progress.percent}%` }}
          />
        </div>

        <div className="grid gap-3 mt-5 md:grid-cols-2 xl:grid-cols-4">
          {timeline.map((step, index) => (
            <TrackerStep
              key={step.label}
              step={step}
              isLast={index === timeline.length - 1}
            />
          ))}
        </div>
      </div>

      <div className="p-4 mt-4 bg-white border border-blue-100 rounded-lg">
        <div className="flex items-start gap-3">
          <span className="flex items-center justify-center w-9 h-9 rounded-full bg-blue-100 text-blue-700 shrink-0">
            <AlertCircle className="w-5 h-5" />
          </span>
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Next Recommended Action</h3>
            <p className="mt-1 text-sm leading-6 text-gray-600">{nextAction}</p>
          </div>
        </div>
      </div>
    </section>
  );
};

const TrackerTile = ({ icon: Icon, label, value }) => (
  <div className="p-3 bg-white border border-blue-100 rounded-lg">
    <div className="flex items-center gap-2 text-xs font-medium text-gray-500">
      <Icon className="w-4 h-4 text-blue-500" />
      {label}
    </div>
    <p className="mt-2 text-sm font-semibold text-gray-900 truncate">{value || 'N/A'}</p>
  </div>
);

const TrackerStep = ({ step, isLast }) => {
  const styles = {
    done: {
      icon: CheckCircle2,
      iconClass: 'text-green-600 bg-green-50',
      lineClass: 'bg-green-200',
      textClass: 'text-green-700'
    },
    current: {
      icon: Clock3,
      iconClass: 'text-blue-600 bg-blue-50',
      lineClass: 'bg-blue-200',
      textClass: 'text-blue-700'
    },
    blocked: {
      icon: XCircle,
      iconClass: 'text-red-600 bg-red-50',
      lineClass: 'bg-red-200',
      textClass: 'text-red-700'
    },
    upcoming: {
      icon: Clock3,
      iconClass: 'text-gray-400 bg-gray-50',
      lineClass: 'bg-gray-200',
      textClass: 'text-gray-500'
    }
  };

  const style = styles[step.state] || styles.upcoming;
  const Icon = style.icon;

  return (
    <div className="relative p-3 border border-gray-200 rounded-lg bg-gray-50">
      {!isLast && (
        <div className={`hidden xl:block absolute top-7 left-[calc(100%-4px)] w-5 h-0.5 ${style.lineClass}`} />
      )}
      <div className="flex items-start gap-3">
        <span className={`flex items-center justify-center w-8 h-8 rounded-full shrink-0 ${style.iconClass}`}>
          <Icon className="w-4 h-4" />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-gray-900">{step.label}</p>
          <p className={`mt-1 text-xs font-medium ${style.textClass}`}>{step.statusLabel}</p>
          <p className="mt-2 text-xs leading-5 text-gray-500">{step.description}</p>
        </div>
      </div>
    </div>
  );
};

const buildTrackerTimeline = (caseItem) => {
  const status = caseItem.status || 'PENDING';
  const isPending = status === 'PENDING';
  const isAccepted = status === 'ACCEPTED';
  const isCompleted = status === 'COMPLETED';
  const isDeclined = status === 'DECLINED';

  return [
    {
      label: 'Submitted',
      statusLabel: 'Complete',
      description: `Submitted ${formatDate(caseItem.dateSubmitted)} for review.`,
      state: 'done'
    },
    {
      label: 'Review',
      statusLabel: isDeclined ? 'Declined' : isPending ? 'Current' : 'Complete',
      description: isDeclined
        ? 'The case was reviewed and declined.'
        : isPending
          ? 'Waiting for a lawyer to accept or decline the case.'
          : 'A lawyer has reviewed the case.',
      state: isDeclined ? 'blocked' : isPending ? 'current' : 'done'
    },
    {
      label: 'Active Work',
      statusLabel: isAccepted ? 'Current' : isCompleted ? 'Complete' : 'Upcoming',
      description: 'Documents, notes, appointments, and collaboration happen in the workspace.',
      state: isCompleted ? 'done' : isAccepted ? 'current' : 'upcoming'
    },
    {
      label: 'Closure',
      statusLabel: isCompleted ? 'Current' : 'Upcoming',
      description: 'Final case summary, closure notes, and archived records.',
      state: isCompleted ? 'current' : 'upcoming'
    }
  ];
};

const getProgress = (timeline) => {
  const completed = timeline.filter(step => step.state === 'done').length;
  const current = timeline.some(step => step.state === 'current') ? 0.5 : 0;
  return {
    completed,
    percent: Math.min(100, Math.round(((completed + current) / timeline.length) * 100))
  };
};

const getNextAction = (caseItem, userRole) => {
  switch (caseItem.status) {
    case 'PENDING':
      return userRole === 'LAWYER'
        ? 'Review the case details, then accept it if it matches your specialization or decline it with a clear reason.'
        : 'Wait for a lawyer to review your submitted case. You can still open the case details to verify your information.';
    case 'ACCEPTED':
      return 'Open the legal workspace to upload documents, review notes, message the assigned participant, or ask the AI about next steps.';
    case 'DECLINED':
      return 'Review the declined case details. If needed, submit a clearer case with more complete facts and supporting documents.';
    case 'COMPLETED':
      return 'Review the final case records and keep the archived information for reference.';
    default:
      return 'Open the case details to review the latest status and available actions.';
  }
};

const getParticipant = (caseItem, role) => {
  if (role === 'LAWYER' && caseItem.client) {
    return {
      label: 'Client',
      name: `${caseItem.client.Fname || ''} ${caseItem.client.Lname || ''}`.trim()
    };
  }

  if (role === 'CLIENT' && caseItem.lawyer) {
    return {
      label: 'Lawyer',
      name: `${caseItem.lawyer.Fname || ''} ${caseItem.lawyer.Lname || ''}`.trim()
    };
  }

  return {
    label: role === 'LAWYER' ? 'Client' : 'Lawyer',
    name: role === 'CLIENT' ? 'Awaiting assignment' : 'N/A'
  };
};

const statusClass = (status) => {
  switch (status) {
    case 'ACCEPTED':
      return 'bg-green-100 text-green-800';
    case 'PENDING':
      return 'bg-yellow-100 text-yellow-800';
    case 'DECLINED':
      return 'bg-red-100 text-red-800';
    case 'COMPLETED':
      return 'bg-blue-100 text-blue-800';
    default:
      return 'bg-gray-100 text-gray-700';
  }
};

const formatStatus = (status) => status ? status.toLowerCase().replace(/^\w/, char => char.toUpperCase()) : 'Unknown';

const formatDate = (value) => {
  if (!value) return 'N/A';
  return new Date(value).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
};

export default CaseTracker;
