<!-- Managed by ccx -->
# 백엔드 테스트 (JUnit5)

> 구현이 아니라 **행동**을 검증. mock 도구는 `lang`에 따름 — kotlin → **MockK**, java → **Mockito**.

## DO
1. **JUnit5** 기본. 단위 테스트는 **스프링 컨텍스트 없이** 순수하게 — service 로직은 협력자를 mock으로 빠르게.
2. **슬라이스 테스트** — `@WebMvcTest`(controller)·`@DataJpaTest`(repository). 전체 `@SpringBootTest`는 최소(느림).
3. **통합/DB는 Testcontainers**(실제 DB 이미지). H2 대체는 DB 동작 불일치 주의.
4. given-when-then, 의미 있는 단언(상태·상호작용). 외부 HTTP는 mock/WireMock.
5. 도메인 불변식·검증·에러 경로(실패 케이스) 커버.

## DON'T
1. 모든 테스트를 `@SpringBootTest`로(느리고 깨지기 쉬움).
2. 구현 디테일(private·내부 호출 횟수) 과결합 테스트.
3. 운영 DB/외부 시스템 실호출. 커버리지 숫자 목표용 무의미 테스트.
