FROM eclipse-temurin:17-jre
WORKDIR /app
COPY target/announcement-ms.jar app.jar
# Entando requires microservices to listen on 8081.
EXPOSE 8081
ENTRYPOINT ["java", "-jar", "/app/app.jar"]
