package com.synapse.api.util;

import java.time.Duration;

public class Constant {

    private Constant() {}

    // JWT
    public static final String AUTHORIZATION_HEADER = "Authorization";
    public static final String BEARER_PREFIX = "Bearer ";
    public static final long ACCESS_EXPIRED = 60 * 60L; // (초 단위) 1시간
    public static final long REFRESH_EXPIRED = 14 * 24 * 60 * 60L; // (초 단위) 14일

    // Refresh Header
    public static final Duration TICKET_TTL = Duration.ofSeconds(60);

}
