# ALLY retrieval verification ? 2026-09-20

Implemented on `fix/legal-validation-fallback`. HEAD remains `3b6cb67` (`fix: load query index name from environment`), preserving the inherited query-system change.

## Root causes and behavior

- The deployed `main:app` hard-coded its embedding model and defaulted to the old Pinecone index. Startup now requires the environment index and the requested small model, checks the model and index dimensions (384) and cosine metric, and fails with a sanitized configuration error. No index fallback is used.
- Pinecone metadata was returned without legal verification. Verification now requires an approved HTTPS official host, explicit Supreme Court court level, nonempty explicit disposition, and a `final_disposition` section/chunk type. Similarity and verdict-looking text never establish verification. Mixed results are unverified unless every returned record passes.
- Java did not map snake-case rejection fields and swallowed upstream failures into empty success objects. DTOs now preserve rejection and validation fields; retrieval failures return HTTP 503 through the controller.
- The controller fed incomplete excerpts and even retrieval failures into an answer generator. Case-search responses now return deterministic retrieval wording and records without generated legal conclusions. This temporary retrieval flow also uses deterministic wording for verified records. General chat with case search disabled retains its existing behavior.
- The UI omitted excerpts and sections, discarded validation metadata, and accepted arbitrary nonempty links. It now renders up to three records, sections, excerpts, case numbers, similarity, safe HTTP(S) links, and the exact warning. It distinguishes unavailable service, no results, and unverified results.

## Actual request path and schemas

1. `ally-frontend/src/components/AllyConsultationChat.jsx` calls `sendConsultationMessage` in `src/services/allyConsultationService.js`.
2. Axios posts to `${VITE_API_BASE_URL}/api/chat/prompt` with `{message, useRAG, conversationId, requestId, previousMessages:[{role,content}]}` and the existing authorization header when signed in.
3. `Ally/src/main/java/com/wachichaw/AllyChatAI/Controller/ChatController.java` receives `ChatRequest`. Initial turns also use `RagService.validateQuestion` ? POST `/api/validate` with `{query}`. Its response is `{is_valid,rejection_reason,confidence,method,details}`.
4. With case search enabled, `AllyRAG/RagService.java` posts `{query,top_k:3}` to `${RAG_SERVICE_URL}/search` and deserializes `RagSearchResponse` and `LegalCase`.
5. FastAPI `Ally-FinetuneRAG/main.py:search_cases` classifies the query, embeds it with the configured model, then queries the configured Pinecone index with a 384-element normalized vector, `include_metadata=true`, and at most three matches. The existing 0.54 threshold remains. `PINECONE_NAMESPACE` is sent only if explicitly configured.
6. FastAPI returns `{cases,count,query,rejected,confidence,legal_validation_status,can_state_final_outcome,validation_warning}`. Cases retain `{title,case_number,score,content,citation,section,source_url}` plus per-record validation fields. `score` remains a percentage for compatibility; `confidence` is 0?1.
7. Java retains its existing frontend schema `{response,relevantCases,caseCount,confidence,ragEnabled,timestamp,conversationId,requestId}` and adds the same three snake-case validation fields. Java confidence remains a percentage string. Saved chat metadata serializes the complete DTO; the existing history reader spreads that metadata back into frontend messages.
8. The new `RetrievedCases.jsx` renders the preserved records and warning. The old Vertex AI script is not involved. The Dockerfile starts `uvicorn main:app`.

## Configuration loading

- FastAPI loads `.env` beside `main.py` with python-dotenv; existing process environment wins. Required: `PINECONE_API_KEY`, `PINECONE_INDEX_NAME`, `EMBEDDING_MODEL`. The local index/model match the requested configuration. Optional: `PINECONE_NAMESPACE`, `DEEPSEEK_API_KEY`, `DEEPSEEK_BASE_URL`, `DEEPSEEK_MODEL`, `PORT`. No environment files were changed.
- Spring uses `application.properties`, including `spring.config.import=optional:file:.env[.properties]`, relative to the backend working directory, and process/deployment environment. Retrieval requires `RAG_ENABLED=true`; `RAG_SERVICE_URL` defaults to localhost:8000. Optional timeout names: `RAG_SERVICE_TIMEOUT`, `RAG_HEALTH_TIMEOUT`. Existing backend startup dependencies still require appropriate `DB_URL`, `DB_USERNAME`, `DB_PASSWORD` and the application's other configured services. DeepSeek environment names above apply to general chat as well.
- Vite reads `VITE_API_BASE_URL` at development startup/build time. It must point to Spring Boot, not FastAPI. Spring's `FRONTEND_URL` configures the frontend origin used elsewhere in the application.

## API examples

Frontend ? Java:

```json
{"message":"Retrieve Pedro P. Isican v. People, G.R. No. 266431","useRAG":true}
```

Java ? FastAPI:

```json
{"query":"Retrieve Pedro P. Isican v. People, G.R. No. 266431","top_k":3}
```

Illustrative FastAPI response shape (title, score and excerpt are example data, not a transcript of the live result):

```json
{
  "cases": [{
    "title": "Example case record", "case_number": "", "score": 90.0,
    "content": "Retrieved excerpt", "citation": "", "section": "verdict", "source_url": "",
    "legal_validation_status": "unverified", "can_state_final_outcome": false,
    "validation_warning": "ALLY found potentially relevant case records, but the final Supreme Court disposition could not be verified from the currently indexed metadata. The retrieved text may include rulings from lower courts. Please review the official Supreme Court or E-Library decision before relying on the legal outcome."
  }],
  "count": 1, "query": "Example query", "rejected": false, "confidence": 0.9,
  "legal_validation_status": "unverified", "can_state_final_outcome": false,
  "validation_warning": "ALLY found potentially relevant case records, but the final Supreme Court disposition could not be verified from the currently indexed metadata. The retrieved text may include rulings from lower courts. Please review the official Supreme Court or E-Library decision before relying on the legal outcome."
}
```

Java maps `cases` to `relevantCases`, `count` to `caseCount`, sets `ragEnabled:true`, and returns `response:"Retrieved case text is shown below. Review the source decision before relying on a legal outcome."` with the same validation fields. Verified records use `verified`, `true`, and `null`. Empty retrieval retains `cases:[]`, `count:0`, `rejected:false`, `confidence:0.0`; no generated answer replaces it. Service failure is HTTP 503 (FastAPI `{detail:...}`, Java `{response:"Case retrieval is unavailable. Please try again later.",confidence:"Service unavailable",...}`).

## Changed files

- `Ally-FinetuneRAG/main.py`: runtime configuration, dimension checks, metadata normalization, validation, capped retrieval, sanitized errors.
- `Ally-FinetuneRAG/tests/test_retrieval.py`: offline mocked contract/configuration/validation/error tests.
- `Ally-FinetuneRAG/tests/verify_live_retrieval.py`: opt-in read-only live Isican check.
- `Ally/.../AllyRAG/{RagService,RagSearchResponse,ChatResponse,LegalCase}.java`: transport, health, DTO mapping.
- `Ally/.../AllyChatAI/Controller/ChatController.java`: deterministic retrieval responses and honest service errors.
- `Ally/src/test/java/com/wachichaw/Deployment/RetrievalContractTest.java`: HTTP mapping, timeout, controller safeguard tests.
- `Ally/src/test/java/com/wachichaw/Deployment/ExternalServiceTest.java`: update disabled retrieval expectation to an honest unavailable error.
- `ally-frontend/src/services/allyConsultationService.js`: preserve validation fields.
- `ally-frontend/src/components/AllyConsultationChat.jsx`: preserve validation metadata and use retrieval rendering component.
- `ally-frontend/src/components/RetrievedCases.jsx` and `.test.mjs`: case display and offline rendering tests.
- This report.

## Verification

- Python: `.venv/Scripts/python.exe -m unittest discover -s tests -v` from `Ally-FinetuneRAG`: **6 passed**, with mocked ML/Pinecone/classifier calls. Cases cover configuration, dimensions, three-result cap, missing source/metadata, verdict chunks, high similarity, approved official metadata, hostile URLs, empty results, upstream errors and compatible fields.
- Java: `./mvnw.cmd -Dtest=RetrievalContractTest,ExternalServiceTest package` from `Ally`: **9 passed; BUILD SUCCESS**, including controller verification that no answer generator is called for unverified retrieval or failure.
- Frontend: `node --test src/components/RetrievedCases.test.mjs`: **3 passed**, using React server rendering and no external services.
- Frontend production build: `npm run build`: **PASS** (2,940 modules). Existing Firebase import/chunk-size warnings remain.
- Live: `.venv/Scripts/python.exe tests/verify_live_retrieval.py`: **PASS**, HTTP 200. Actual configured Pinecone query retrieved Isican, returned at most three records, marked outcome unverified, included the exact warning; all three source links were empty. The check used the updated FastAPI app through its in-process HTTP test client, real startup, real model and real Pinecone. It did not assert a final Supreme Court outcome.
- Full browser ? running Spring ? FastAPI verification remains blocked: ports 8080 and 5173 had no services listening. Port 8000 was already occupied, so the live check used an isolated app instance without replacing the existing process. Java transport/controller and frontend rendering were verified independently.
- Maven initially hit sandbox network restrictions; approved retry passed. The initial frontend build found absent declared `react-markdown`; `npm install --no-save --package-lock=false --ignore-scripts` restored declared dependencies without changing manifests or lockfiles.

## Manual integrated check before deployment

1. Start the updated FastAPI application from `Ally-FinetuneRAG` with `.venv/Scripts/python.exe -m uvicorn main:app --host 127.0.0.1 --port 8000`, after stopping your existing process on that port. Ensure the configured index/model match the request and preserve any existing namespace.
2. Start Spring from `Ally` with its database/services available, `RAG_ENABLED=true`, and `RAG_SERVICE_URL` pointing to that FastAPI instance: `./mvnw.cmd spring-boot:run`.
3. Start the frontend from `ally-frontend` using `npm run dev`, with `VITE_API_BASE_URL` pointing to Spring. Open the consultation page, enable Case Search, and send the Isican query above.
4. Confirm at most three visible records, case number/score/section/excerpt, the exact warning, no source link for empty URLs, and no generated claim that the MTC conviction was the Supreme Court outcome. Reload a saved chat and confirm records/warning persist.
5. Stop FastAPI temporarily and repeat: expect HTTP 503 and an unavailable message. Restore FastAPI. An empty retrieval should instead say no relevant cases found.

Pinecone data was not modified: only index description and vector query operations were used. No vectors were deleted, updated, upserted or re-indexed. The index dimension, model, namespace and threshold were not changed. No `.env` files or the untracked `Ally-FinetuneRAG/python` file were modified or staged. Nothing was committed, pushed, merged or deployed, and `main` was not switched to or modified.
