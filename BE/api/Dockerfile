# 1단계: 빌드용 이미지 (Gradle 8.14.3 + JDK 17)
FROM gradle:8.14.3-jdk17 AS build
WORKDIR /app

COPY . .
RUN gradle clean bootJar -x test

# 2단계: 실행용 이미지 (JRE 17)
FROM eclipse-temurin:17-jre
ENV TZ=Asia/Seoul
WORKDIR /app

COPY --from=build /app/build/libs/*.jar app.jar

EXPOSE 8080
ENV JAVA_TOOL_OPTIONS="-Xms256m -Xmx512m"
ENTRYPOINT ["java", "-jar", "/app/app.jar"]