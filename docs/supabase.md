# Supabase 연결 상태

- 프로젝트 ref: `ermjugtkrcqbheqnpanv`, MCP(`.mcp.json`)로 연결됨 — 아직 `supabase/` 디렉토리도 CLI도 없으므로 `supabase db ...` 대신 MCP 도구(`execute_sql`, `get_advisors`, `search_docs`)를 사용할 것.
- 마이그레이션 방식 미정. 스키마 SQL을 작성하기 전에 declarative schemas(`supabase/schemas/`)로 갈지 imperative migrations로 갈지 먼저 확인하고, 임의로 정하지 말 것.
