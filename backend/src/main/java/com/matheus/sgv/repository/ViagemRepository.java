package com.matheus.sgv.repository;

import com.matheus.sgv.model.Usuario;
import com.matheus.sgv.model.Viagem;
import com.matheus.sgv.model.enums.StatusViagem;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public interface ViagemRepository extends JpaRepository<Viagem, UUID> {

    // Histórico / listagem geral do usuário
    List<Viagem> findByUsuarioOrderByData_partidaDesc(Usuario usuario);

    // Calendário: viagens do usuário num intervalo de datas
    List<Viagem> findByUsuarioAndData_partidaBetween(Usuario usuario, LocalDate inicio, LocalDate fim);

    // Filtro por status (ex: listar só AGENDADA ou só CONCLUIDA)
    List<Viagem> findByUsuarioAndStatusViagem(Usuario usuario, StatusViagem status);

    // Dashboard financeiro: viagens concluídas num período (para somar valorCobrado)
    List<Viagem> findByUsuarioAndStatusViagemAndData_partidaBetween(
            Usuario usuario, StatusViagem status, LocalDate inicio, LocalDate fim);
}