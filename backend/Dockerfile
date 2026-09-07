FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /app
COPY pom.xml ./
RUN mvn dependency:go-offline -B
COPY src ./src
RUN mvn package -DskipTests -B

FROM eclipse-temurin:21-jre-alpine
ARG VCS_REF=development
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar
LABEL org.opencontainers.image.source="https://github.com/JoaoNunes-ppb/trainning-management-app" \
      org.opencontainers.image.revision="${VCS_REF}"
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
