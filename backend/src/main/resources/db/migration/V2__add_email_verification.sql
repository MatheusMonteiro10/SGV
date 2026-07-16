-- V2__add_email_verification.sql

ALTER TABLE usuario
    ADD COLUMN email_verified BOOLEAN NOT NULL DEFAULT FALSE;

CREATE TABLE codigo_verificacao
(
    id         UUID        NOT NULL,
    usuario_id UUID        NOT NULL,
    codigo     VARCHAR(6)  NOT NULL,
    tipo       VARCHAR(20) NOT NULL,
    expiracao  TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    usado      BOOLEAN     NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    CONSTRAINT pk_codigo_verificacao PRIMARY KEY (id)
);

ALTER TABLE codigo_verificacao
    ADD CONSTRAINT fk_codigo_verificacao_usuario FOREIGN KEY (usuario_id) REFERENCES usuario (id) ON DELETE CASCADE;

ALTER TABLE codigo_verificacao
    ADD CONSTRAINT chk_codigo_verificacao_tipo CHECK (tipo IN ('REGISTRO', 'RESET_SENHA'));

-- Acesso mais frequente: buscar o código ativo mais recente de um usuário para um tipo
CREATE INDEX idx_codigo_verificacao_usuario_tipo ON codigo_verificacao (usuario_id, tipo);