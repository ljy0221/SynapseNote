package com.synapse.api.util.generator;

import com.github.f4b6a3.uuid.UuidCreator;
import org.hibernate.engine.spi.SharedSessionContractImplementor;
import org.hibernate.id.IdentifierGenerator;

import java.io.Serializable;
import java.util.UUID;

/**
 * UUID v7 Generator for Hibernate
 *
 * <p>UUID v7은 RFC 9562에 정의된 시간 기반 UUID입니다.</p>
 *
 * <h3>구조</h3>
 * <ul>
 *   <li>48 bits: Unix Epoch milliseconds (타임스탬프)</li>
 *   <li>12 bits: 서브밀리초 시퀀스</li>
 *   <li>6 bits: 버전 및 variant</li>
 *   <li>62 bits: 랜덤 또는 카운터</li>
 * </ul>
 *
 * <h3>장점</h3>
 * <ul>
 *   <li>시간 기반 정렬 가능</li>
 *   <li>DB 인덱스 성능 향상</li>
 *   <li>디버깅 용이 (생성 시간 추정 가능)</li>
 * </ul>
 *
 * @see <a href="https://datatracker.ietf.org/doc/html/rfc9562">RFC 9562</a>
 * @see com.github.f4b6a3.uuid.UuidCreator
 */
public class UuidV7Generator implements IdentifierGenerator {

    @Override
    public Serializable generate(
            SharedSessionContractImplementor session,
            Object object) {
        return UuidCreator.getTimeOrderedEpoch();
    }
}
