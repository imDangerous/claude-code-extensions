<!-- Managed by ccx -->
# Spring 백엔드 구조 (layered)

> Spring Boot 백엔드 규약. 언어는 `.claude/extends/config.json`의 `lang`(kotlin/java). 빌드는 Gradle(Kotlin DSL) 기본 가정(Maven도 가능 — 도구 비종속). 일반 원칙은 `agent-workflow`·`validation`·`observability`·`entropy`(core 상속).

## 계층 (단방향 의존)
- `controller`(web 경계) → `service`(유스케이스·트랜잭션) → `repository`(영속). 역방향·계층 건너뛰기 금지.
- **DTO 경계** — controller는 요청/응답 DTO로 입출력. **엔티티를 web에 직접 노출 금지**. 매핑은 명시적(매퍼/확장함수).
- 도메인 로직은 service/도메인 모델에. controller는 얇게(검증·위임·응답).

## DI / 의존
- **생성자 주입**만(필드 `@Autowired` 금지). 협력자는 인터페이스로 추상화(테스트 대체 가능).
- 컴포넌트 스캔 범위 명확히. 순환 의존 금지.

## 트랜잭션
- `@Transactional`은 **service 계층**에. 조회는 `readOnly = true`. controller/repository에 두지 않는다.
- 트랜잭션 경계 안에서 외부 HTTP/메시징 호출 지양(롤백·지연 문제).

## 예외 / 에러 응답
- 도메인 예외 정의 → `@RestControllerAdvice` 전역 처리 → **일관된 에러 바디**(code·message·필드). 스택트레이스·내부 정보 노출 금지.

## API / 설정
- REST 규약·정확한 상태코드. 입력 검증은 `validation-backend`(`@Valid`). 페이징/정렬 표준화.
- 프로파일별 설정(`application-{env}`). **시크릿은 환경변수/시크릿 매니저** — 소스·이미지·VCS에 금지.

> 언어별 관용(kotlin/java)은 `spring-lang.md`(config `lang`에 따라 해당 언어만 배포).
