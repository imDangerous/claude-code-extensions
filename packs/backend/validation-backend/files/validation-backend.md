<!-- Managed by ccx -->
# 입력 검증 — Bean Validation (Spring)

> `validation.md` 원칙(경계에서 검증·fail-closed)의 JVM 구현.

## DO
1. **경계 DTO에 제약 애너테이션** — `@NotNull`·`@NotBlank`·`@Size`·`@Email`·`@Positive` 등. controller 파라미터에 `@Valid`/`@Validated`로 강제.
2. **검증 실패 → 전역 처리** — `MethodArgumentNotValidException`/`ConstraintViolationException`을 `@RestControllerAdvice`에서 400 + 필드 에러로 매핑.
3. **커스텀 제약** — 복합 규칙은 `ConstraintValidator` 구현. 단계 검증은 그룹/`@GroupSequence`.
4. **이중 방어** — 도메인 불변식은 엔티티/값객체 **생성자**에서도 보장(영속 전 무효 상태 차단).
5. 외부 연동 응답·메시지 페이로드도 신뢰 경계 — 역직렬화 후 검증.

## DON'T
1. service 깊은 곳에서 뒤늦게 검증(경계에서).
2. `@Valid` 누락한 채 DTO 신뢰. 검증 우회 경로.
3. 검증 안 된 입력을 엔티티에 바로 바인딩·영속.
