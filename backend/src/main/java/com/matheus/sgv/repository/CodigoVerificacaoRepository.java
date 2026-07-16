package com.matheus.sgv.repository;

import com.matheus.sgv.model.CodigoVerificacao;
import com.matheus.sgv.model.Usuario;
import com.matheus.sgv.model.enums.TipoCodigoVerificacao;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;
import java.util.UUID;

public interface CodigoVerificacaoRepository extends JpaRepository<CodigoVerificacao, UUID> {

    Optional<CodigoVerificacao> findTopByUsuarioAndTipoAndUsadoFalseOrderByExpiracaoDesc(
            Usuario usuario, TipoCodigoVerificacao tipo);

    @Modifying
    @Query("UPDATE CodigoVerificacao c SET c.usado = true " +
            "WHERE c.usuario = :usuario AND c.tipo = :tipo AND c.usado = false")
    void invalidarTodos(@Param("usuario") Usuario usuario, @Param("tipo") TipoCodigoVerificacao tipo);
}