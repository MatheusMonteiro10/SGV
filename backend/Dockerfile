# ---- Estágio de build ----
FROM eclipse-temurin:21-jdk-alpine AS build
WORKDIR /app

# Copia primeiro só o que é necessário pra resolver dependências,
# isso deixa o cache de camadas do Docker eficiente: se só o código
# mudar (não o pom.xml), o passo de download de dependências não reroda
COPY mvnw .
COPY .mvn .mvn
COPY pom.xml .
RUN chmod +x mvnw && ./mvnw dependency:go-offline -B

COPY src src
RUN ./mvnw clean package -DskipTests -B

# ---- Estágio final ----
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

COPY --from=build /app/target/*.jar app.jar

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.jar"]