package com.matheus.sgv.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import jakarta.persistence.criteria.CriteriaBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    private static final String ESQUEMA_JWT = "bearerAuth";

    @Bean
    public OpenAPI sgvOpenApi() {
        return new OpenAPI()
        .info(new Info()
                .title("SGV - Sistema de Gestão de Viagens")
                .description("API REST para gestão de viagens, agenda e faturamento de motorista autônomos.")
                .version("v1")
                .contact(new Contact().name("Matheus")))
        .components(new Components()
                .addSecuritySchemes(ESQUEMA_JWT, new SecurityScheme()
                        .name(ESQUEMA_JWT)
                        .type(SecurityScheme.Type.HTTP)
                        .scheme("bearer")
                        .bearerFormat("JWT")
                        .description("Informe o token obtido em /api/auth/login ou /api/auth/google ")))
        /* Aplica o cadeado "Authorize" globalmente; endpoints de /api/auth/** continuam
         publicamente acessíveis no Swagger UI mesmo com essa exigência declarada,
         porque a exigência é só documentacional, quem barra de fato é o SecurityConfig.*/
        .addSecurityItem(new SecurityRequirement().addList(ESQUEMA_JWT));
    }
}
