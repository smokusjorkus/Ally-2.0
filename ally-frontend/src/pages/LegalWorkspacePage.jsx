import React, { useEffect, useMemo, useState } from 'react';
import { Bot, BriefcaseBusiness, Calendar, FileText, History, Loader2, NotebookPen, Search, Send, UserRound } from 'lucide-react';
import { toast } from 'sonner';
import { caseService } from '../services/caseService.jsx';
import { getConsultationHistory, sendConsultationMessage } from '../services/allyConsultationService.js';
import { documentService } from '../services/documentService.js';
import { getAuthData } from '../utils/auth.jsx';
import CaseDocumentManager from '../components/CaseDocumentManager.jsx';
import MarkdownText from '../components/shared/MarkdownText.jsx';

const LegalWorkspacePage = () => {
  const [authData, setAuthData] = useState(null);
  const [cases, setCases] = useState([]);
  const [selectedCaseId, setSelectedCaseId] = useState(null);
  const [documentCounts, setDocumentCounts] = useState({});
  const [aiHistory, setAiHistory] = useState([]);
  const [notes, setNotes] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiReply, setAiReply] = useState(null);
  const [selectedHistoryId, setSelectedHistoryId] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const auth = getAuthData();
    if (!auth) {
      toast.error('Please log in to open your legal workspace');
      setLoading(false);
      return;
    }
    setAuthData(auth);
  }, []);

  useEffect(() => {
    if (authData) {
      loadWorkspace();
    }
  }, [authData]);

  useEffect(() => {
    if (!authData || !selectedCaseId) {
      setNotes('');
      return;
    }

    setNotes(localStorage.getItem(getNotesKey(selectedCaseId, authData.userId)) || '');
  }, [selectedCaseId, authData]);

  const loadWorkspace = async () => {
    try {
      setLoading(true);
      const caseList = authData.accountType === 'LAWYER'
        ? await caseService.getLawyerCases(authData.userId)
        : await caseService.getClientCases(authData.userId);

      const visibleCases = (caseList || []).filter(caseItem => caseItem.status !== 'CANCELLED');
      setCases(visibleCases);
      setSelectedCaseId(current => current || visibleCases[0]?.caseId || null);

      const counts = {};
      await Promise.all(visibleCases.map(async (caseItem) => {
        counts[caseItem.caseId] = await documentService.getDocumentCount(caseItem.caseId);
      }));
      setDocumentCounts(counts);

      if (authData.accountType !== 'ADMIN') {
        const history = await getConsultationHistory(25);
        setAiHistory(history);
      }
    } catch (error) {
      console.error('Error loading legal workspace:', error);
      toast.error('Failed to load legal workspace');
    } finally {
      setLoading(false);
    }
  };

  const selectedCase = useMemo(
    () => cases.find(caseItem => caseItem.caseId === Number(selectedCaseId)),
    [cases, selectedCaseId]
  );

  const filteredCases = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return cases;

    return cases.filter(caseItem =>
      [caseItem.title, caseItem.caseType, caseItem.description, caseItem.status]
        .filter(Boolean)
        .some(value => String(value).toLowerCase().includes(term))
    );
  }, [cases, searchTerm]);

  const saveNotes = (value) => {
    setNotes(value);
    if (!authData || !selectedCaseId) return;
    localStorage.setItem(getNotesKey(selectedCaseId, authData.userId), value);
  };

  const askWorkspaceAi = async (event) => {
    event.preventDefault();
    if (!aiPrompt.trim() || !selectedCase) return;

    setAiLoading(true);
    try {
      const contextualPrompt = buildWorkspacePrompt(selectedCase, notes, aiPrompt);
      const response = await sendConsultationMessage(contextualPrompt, true);
      setAiReply(response);
      setSelectedHistoryId(null);
      setAiPrompt('');
      const history = await getConsultationHistory(25);
      setAiHistory(history);
    } catch (error) {
      console.error('Error asking workspace AI:', error);
      toast.error('Failed to ask AI from workspace');
    } finally {
      setAiLoading(false);
    }
  };

  const openHistoryInChat = (item) => {
    setSelectedHistoryId(item.historyId);
    setAiPrompt(item.userMessage || '');
    setAiReply({
      response: item.aiResponse,
      relevantCases: null,
      caseCount: item.caseCount || 0,
      confidence: item.confidence || null,
      ragEnabled: item.ragEnabled || false,
      timestamp: item.createdAt
    });
  };

  const participant = getParticipant(selectedCase, authData?.accountType);

  if (loading) {
    return (
      <div className="px-4 py-8 mx-auto max-w-7xl">
        <div className="flex items-center justify-center py-24 bg-white border border-gray-200 rounded-lg">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          <span className="ml-3 text-gray-600">Loading legal workspace...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-8 mx-auto max-w-7xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Legal Workspace</h1>
        <p className="mt-1 text-sm text-gray-600">
          Work from one case hub: documents, notes, case context, and AI consultation history.
        </p>
      </div>

      <div className="grid gap-5 lg:grid-cols-[320px_minmax(0,1fr)]">
        <aside className="bg-white border border-gray-200 rounded-lg">
          <div className="p-4 border-b border-gray-200">
            <div className="relative">
              <Search className="absolute w-4 h-4 text-gray-400 -translate-y-1/2 left-3 top-1/2" />
              <input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search cases"
                className="w-full py-2 pl-10 pr-3 text-sm border border-gray-300 rounded-md focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>
          </div>

          <div className="max-h-[calc(100vh-250px)] overflow-y-auto p-2">
            {filteredCases.length === 0 ? (
              <div className="px-3 py-10 text-sm text-center text-gray-500">
                No cases available for this workspace.
              </div>
            ) : (
              filteredCases.map(caseItem => (
                <button
                  key={caseItem.caseId}
                  onClick={() => setSelectedCaseId(caseItem.caseId)}
                  className={`w-full p-3 text-left rounded-md border mb-2 transition-colors ${
                    selectedCaseId === caseItem.caseId
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-transparent hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{caseItem.title || `Case #${caseItem.caseId}`}</p>
                      <p className="mt-1 text-xs text-gray-500">#{caseItem.caseId} · {caseItem.caseType || 'General'}</p>
                    </div>
                    <span className={`px-2 py-1 text-[11px] font-medium rounded-full ${statusClass(caseItem.status)}`}>
                      {caseItem.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-3 text-xs text-gray-500">
                    <FileText className="w-3.5 h-3.5" />
                    <span>{documentCounts[caseItem.caseId] || 0} document{documentCounts[caseItem.caseId] === 1 ? '' : 's'}</span>
                  </div>
                </button>
              ))
            )}
          </div>
        </aside>

        <section className="space-y-5">
          {!selectedCase ? (
            <div className="p-10 text-center bg-white border border-gray-200 rounded-lg">
              <BriefcaseBusiness className="w-10 h-10 mx-auto text-gray-400" />
              <h2 className="mt-3 text-lg font-semibold text-gray-900">Select a case to begin</h2>
              <p className="mt-1 text-sm text-gray-500">Your workspace appears once a case is selected.</p>
            </div>
          ) : (
            <>
              <div className="p-5 bg-white border border-gray-200 rounded-lg">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div>
                    <div className="flex items-center gap-2 text-sm text-blue-600">
                      <BriefcaseBusiness className="w-4 h-4" />
                      Case #{selectedCase.caseId}
                    </div>
                    <h2 className="mt-2 text-xl font-bold text-gray-900">{selectedCase.title}</h2>
                    <p className="mt-2 text-sm leading-6 text-gray-600">{selectedCase.description || 'No description provided.'}</p>
                  </div>
                  <span className={`self-start px-3 py-1 text-xs font-semibold rounded-full ${statusClass(selectedCase.status)}`}>
                    {selectedCase.status}
                  </span>
                </div>

                <div className="grid gap-3 mt-5 sm:grid-cols-2 lg:grid-cols-4">
                  <InfoTile icon={Calendar} label="Submitted" value={formatDate(selectedCase.dateSubmitted)} />
                  <InfoTile icon={BriefcaseBusiness} label="Type" value={selectedCase.caseType || 'General'} />
                  <InfoTile icon={UserRound} label={participant.label} value={participant.name} />
                  <InfoTile icon={FileText} label="Documents" value={`${documentCounts[selectedCase.caseId] || 0}`} />
                </div>
              </div>

              <div className="p-4 bg-white border border-blue-100 rounded-lg shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <Bot className="w-5 h-5 text-blue-600" />
                  <h3 className="text-base font-semibold text-gray-900">Ask AI About This Case</h3>
                </div>
                <form onSubmit={askWorkspaceAi} className="flex flex-col gap-3 md:flex-row">
                  <input
                    value={aiPrompt}
                    onChange={(event) => setAiPrompt(event.target.value)}
                    placeholder="Ask about next steps, legal issues, documents needed, or case strategy..."
                    className="flex-1 px-4 py-3 text-sm border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    disabled={aiLoading}
                  />
                  <button
                    type="submit"
                    disabled={!aiPrompt.trim() || aiLoading}
                    className="inline-flex items-center justify-center gap-2 px-5 py-3 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                  >
                    {aiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    Ask
                  </button>
                </form>

                {aiReply?.response && (
                  <div className="p-4 mt-4 border border-blue-100 rounded-lg bg-blue-50">
                    <div className="flex items-center justify-between gap-3 mb-2">
                      <p className="text-sm font-semibold text-blue-900">
                        {selectedHistoryId ? 'Restored AI Chat' : 'AI Response'}
                      </p>
                      {aiReply.confidence && (
                        <span className="text-xs font-medium text-blue-700">{aiReply.confidence}</span>
                      )}
                    </div>
                    {selectedHistoryId && aiPrompt && (
                      <div className="p-3 mb-3 text-sm bg-white border border-blue-100 rounded-md">
                        <p className="text-xs font-semibold text-gray-500">Question</p>
                        <p className="mt-1 text-gray-800">{aiPrompt}</p>
                      </div>
                    )}
                    <div className="text-sm leading-6 text-gray-700">
                      <MarkdownText text={aiReply.response} />
                    </div>
                  </div>
                )}
              </div>

              <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
                <div className="p-5 bg-white border border-gray-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-4">
                    <FileText className="w-5 h-5 text-blue-600" />
                    <h3 className="text-lg font-semibold text-gray-900">Case Documents</h3>
                  </div>
                  {selectedCase.status === 'ACCEPTED' ? (
                    <CaseDocumentManager
                      caseId={selectedCase.caseId}
                      caseInfo={selectedCase}
                      userRole={authData.accountType}
                      authData={authData}
                      onDocumentsChange={loadWorkspace}
                    />
                  ) : (
                    <div className="p-6 text-sm text-gray-600 border border-gray-200 rounded-md bg-gray-50">
                      Document access opens once the case is accepted.
                    </div>
                  )}
                </div>

                <div className="space-y-5">
                  <div className="p-5 bg-white border border-gray-200 rounded-lg">
                    <div className="flex items-center gap-2 mb-3">
                      <NotebookPen className="w-5 h-5 text-blue-600" />
                      <h3 className="text-lg font-semibold text-gray-900">Workspace Notes</h3>
                    </div>
                    <textarea
                      value={notes}
                      onChange={(event) => saveNotes(event.target.value)}
                      placeholder="Add private notes, next steps, questions, or reminders for this case..."
                      className="w-full h-48 p-3 text-sm border border-gray-300 rounded-md resize-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    />
                    <p className="mt-2 text-xs text-gray-500">Notes are saved on this browser for this case.</p>
                  </div>

                  <div className="p-5 bg-white border border-gray-200 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <History className="w-5 h-5 text-blue-600" />
                        <h3 className="text-lg font-semibold text-gray-900">AI History</h3>
                      </div>
                      <button onClick={loadWorkspace} className="text-xs font-medium text-blue-600 hover:text-blue-700">
                        Refresh
                      </button>
                    </div>
                    <div className="space-y-3 max-h-[420px] overflow-y-auto">
                      {aiHistory.length === 0 ? (
                        <p className="text-sm text-gray-500">No saved AI consultations yet.</p>
                      ) : (
                        aiHistory.slice(0, 8).map(item => (
                          <button
                            key={item.historyId}
                            onClick={() => openHistoryInChat(item)}
                            className={`w-full p-3 text-left border rounded-md transition-colors ${
                              selectedHistoryId === item.historyId
                                ? 'border-blue-400 bg-blue-50'
                                : 'border-gray-200 hover:bg-gray-50'
                            }`}
                          >
                            <p className="text-xs text-gray-500">{formatDateTime(item.createdAt)}</p>
                            <p className="mt-1 text-sm font-semibold text-gray-900 line-clamp-2">{item.userMessage}</p>
                            <div className="mt-2 text-sm text-gray-600 line-clamp-4">
                              <MarkdownText text={item.aiResponse} />
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
};

const InfoTile = ({ icon: Icon, label, value }) => (
  <div className="p-3 border border-gray-200 rounded-md bg-gray-50">
    <div className="flex items-center gap-2 text-xs font-medium text-gray-500">
      <Icon className="w-4 h-4" />
      {label}
    </div>
    <p className="mt-2 text-sm font-semibold text-gray-900 truncate">{value || 'N/A'}</p>
  </div>
);

const getNotesKey = (caseId, userId) => `ally.workspace.notes.${userId}.${caseId}`;

const buildWorkspacePrompt = (caseItem, notes, question) => {
  const caseContext = [
    `Case ID: ${caseItem.caseId}`,
    `Title: ${caseItem.title || 'Untitled'}`,
    `Type: ${caseItem.caseType || 'General'}`,
    `Status: ${caseItem.status || 'Unknown'}`,
    `Urgency: ${caseItem.urgencyLevel || 'Not specified'}`,
    `Description: ${caseItem.description || 'No description provided'}`
  ].join('\n');

  return [
    'Use this case workspace context when answering. Keep the answer practical and focused on Philippine law.',
    '',
    caseContext,
    notes ? `\nWorkspace notes:\n${notes}` : '',
    '',
    `User question: ${question}`
  ].filter(Boolean).join('\n');
};

const getParticipant = (caseItem, role) => {
  if (!caseItem) return { label: 'Participant', name: 'N/A' };

  if (role === 'LAWYER') {
    return {
      label: 'Client',
      name: caseItem.client ? `${caseItem.client.Fname || ''} ${caseItem.client.Lname || ''}`.trim() : 'N/A'
    };
  }

  return {
    label: 'Lawyer',
    name: caseItem.lawyer ? `${caseItem.lawyer.Fname || ''} ${caseItem.lawyer.Lname || ''}`.trim() : 'Awaiting assignment'
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

const formatDate = (value) => {
  if (!value) return 'N/A';
  return new Date(value).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
};

const formatDateTime = (value) => {
  if (!value) return 'N/A';
  return new Date(value).toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export default LegalWorkspacePage;
