package com.matheus.sgv;

import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.test.context.ActiveProfiles;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.utility.DockerImageName;

/*
  Classe base para testes de integração que precisam de um Postgres real.
  O container é estático e compartilhado entre todas as subclasses na mesma JVM de teste
  ("singleton container pattern"), evitando subir um Postgres novo a cada classe de teste.
  O ciclo de vida é gerenciado manualmente (start no static block); o Ryuk do Testcontainers
  encerra o container automaticamente quando a JVM de teste finaliza.
 */
@SpringBootTest
@ActiveProfiles("test")
public abstract class BaseIntegrationTest {

    @ServiceConnection
    static final PostgreSQLContainer<?> POSTGRES =
            new PostgreSQLContainer<>(DockerImageName.parse("postgres:16-alpine"));

    static {
        POSTGRES.start();
    }
}