<!-- Managed by ccx -->
# 입력 검증 — zod (JS/TS 구현)

> `validation.md` 원칙(경계에서 검증·fail-closed·parse-don't-validate)의 zod 구현. web·app 공유.

## DO
1. **스키마가 SoT** — 타입은 `z.infer<typeof Schema>`로 도출(스키마 + 별도 TS 인터페이스 중복 정의 금지).
2. **경계에서 parse** — 외부 입력(요청 body/query/params·폼·env·외부 API 응답)을 진입점에서 `safeParse`(또는 `parse`)로 파싱. 비즈니스 로직 안쪽에서 파싱하지 않는다.
3. **명시적 변환** — 강제변환은 `z.coerce`/`transform`으로 의도적으로. 좁은 타입(`z.enum`·`z.literal`) 선호.
4. **공유 스키마** — 클라/서버가 같은 스키마 재사용(폼·API). env는 부팅 시 zod로 검증(누락/오타 즉시 실패).
5. 실패 처리: `safeParse`의 `.error`를 사용자 메시지·필드 에러로 매핑(서버 로그엔 PII 제외).

## DON'T
1. `as`/타입 단언으로 검증 우회. `any`로 받기.
2. 스키마와 TS 타입을 따로 손으로 유지(드리프트).
3. 부분 파싱 후 나머지 신뢰. 깊은 곳에서 뒤늦게 파싱.

## 패턴
- **Server Action / Route Handler**(web): 함수 진입에서 `Schema.parse(input)` 후 사용(검증+인증+인가 각각 — `nextjs.md`).
- **폼**: React Hook Form + `zodResolver(Schema)`.
- **API 응답**: fetch 후 `Schema.parse(await res.json())` — 외부 응답도 신뢰 경계.
