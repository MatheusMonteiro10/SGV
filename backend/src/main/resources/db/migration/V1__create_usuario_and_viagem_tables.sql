CREATE TABLE usuario
(
    id            UUID         NOT NULL,
    nome          VARCHAR(100) NOT NULL,
    email         VARCHAR(150) NOT NULL,
    senha_hash    VARCHAR(255),
    auth_provider VARCHAR(20)  NOT NULL,
    google_id     VARCHAR(255),
    created_at    TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    updated_at    TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    CONSTRAINT pk_usuario PRIMARY KEY (id)
);

CREATE TABLE viagem
(
    id              UUID           NOT NULL,
    usuario_id      UUID           NOT NULL,
    nome_cliente    VARCHAR(150)   NOT NULL,
    destino         VARCHAR(150)   NOT NULL,
    local_partida   VARCHAR(150)   NOT NULL,
    data_partida    date           NOT NULL,
    horario_partida time WITHOUT TIME ZONE      NOT NULL,
    valor_cobrado   DECIMAL(10, 2) NOT NULL,
    observacoes     TEXT,
    status          VARCHAR(20)    NOT NULL,
    avaliacao       INTEGER,
    created_at      TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    updated_at      TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    CONSTRAINT pk_viagem PRIMARY KEY (id)
);

ALTER TABLE usuario
    ADD CONSTRAINT uc_usuario_email UNIQUE (email);

ALTER TABLE usuario
    ADD CONSTRAINT uc_usuario_google UNIQUE (google_id);

ALTER TABLE viagem
    ADD CONSTRAINT FK_VIAGEM_ON_USUARIO FOREIGN KEY (usuario_id) REFERENCES usuario (id) ON DELETE CASCADE;

-- Regras de negócio que o JPA não expressa via anotação:

ALTER TABLE usuario
    ADD CONSTRAINT chk_usuario_provider CHECK (auth_provider IN ('LOCAL', 'GOOGLE'));

ALTER TABLE usuario
    ADD CONSTRAINT chk_usuario_auth_coerente CHECK (
        (auth_provider = 'LOCAL' AND senha_hash IS NOT NULL AND google_id IS NULL)
            OR
        (auth_provider = 'GOOGLE' AND google_id IS NOT NULL)
        );

ALTER TABLE viagem
    ADD CONSTRAINT chk_viagem_status CHECK (status IN ('AGENDADA', 'CONCLUIDA'));

ALTER TABLE viagem
    ADD CONSTRAINT chk_viagem_avaliacao CHECK (avaliacao IS NULL OR avaliacao BETWEEN 1 AND 5);

-- Índices para os acessos mais frequentes (RF02, RF08, RF09, RF10):

CREATE INDEX idx_viagem_usuario_id ON viagem (usuario_id);
CREATE INDEX idx_viagem_data_partida ON viagem (data_partida);
CREATE INDEX idx_viagem_status ON viagem (status);