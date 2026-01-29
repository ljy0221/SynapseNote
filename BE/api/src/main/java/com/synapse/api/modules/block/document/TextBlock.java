package com.synapse.api.modules.block.document;

import lombok.*;
import lombok.experimental.SuperBuilder;
import org.springframework.data.mongodb.core.mapping.Field;
import org.springframework.data.annotation.TypeAlias;

import java.util.Map;

@Getter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
@TypeAlias("text") // MongoDB _class: "text"
public class TextBlock extends BaseBlock {

    /**
     * 마크다운 내용 (properties.content)
     * 예: "**안녕하세요** 반갑습니다. [링크](http...)"
     * * 저장 전략:
     * Yjs(Express) 쪽에서 Delta 포맷을 Markdown String으로 변환해서 저장하는 것을 권장합니다.
     */
    @Field("properties.content")
    private String content;

    /**
     * 추가 속성 (properties.attributes)
     * 마크다운 표준에는 없지만 에디터에서 필요한 속성들
     * 예: { "textColor": "red", "backgroundColor": "yellow", "textAlign": "center" }
     */
    @Field("properties.attributes")
    private Map<String, Object> attributes;

    /**
     * 체크박스 같은 토글 상태 (필요시)
     * (예: "- [x] 할 일" 형태의 마크다운이라도 상태 관리를 위해 별도 필드 추천)
     */
    @Field("properties.checked")
    private Boolean checked;

    // --- 비즈니스 로직 ---

    public void updateContent(String newContent) {
        this.content = newContent;
    }
}