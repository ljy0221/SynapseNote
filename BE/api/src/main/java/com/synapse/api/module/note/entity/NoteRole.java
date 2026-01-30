package com.synapse.api.module.note.entity;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum NoteRole {
    OWNER("소유자", 3),
    EDITOR("편집자", 2),
    VIEWER("뷰어", 1);

    private final String description;
    private final int priority;

    public boolean canEdit() {
        return this == OWNER || this == EDITOR;
    }

    public boolean canDelete() {
        return this == OWNER;
    }

    public boolean canView() {
        return true;
    }
}
