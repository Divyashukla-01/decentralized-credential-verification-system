FROM eclipse-temurin:17-jdk-alpine
WORKDIR /app
COPY target/dcvs-backend-1.0.0.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "-Dspring.profiles.active=railway", "app.jar"]
