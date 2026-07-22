# Supabase 연결 상태

- 프로젝트 ref: `ermjugtkrcqbheqnpanv`, MCP(`.mcp.json` / `.cursor/mcp.json`)로 연결됨.
- CLI: Homebrew `supabase` 설치됨 (로컬 개발·`db diff`용). Docker Desktop이 있어야 shadow DB diff가 동작한다.
- **마이그레이션 방식: Declarative schemas** (`supabase/schemas/`가 소스 오브 트루스 → `supabase db diff -f <name>`으로 `supabase/migrations/` 생성 → 원격 적용).
- 초기 스키마는 Docker 부재로 shadow diff 대신 MCP `apply_migration`으로 원격에 부트스트랩했고, 동일 SQL을 `supabase/migrations/20260722041437_create_tria_core_tables.sql`에 보관했다. 이후 변경은 schemas 수정 → diff → push/apply 흐름을 따른다.
