package com.matheus.sgv.model;

import com.matheus.sgv.model.enums.StatusViagem;
import jakarta.persistence.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.UUID;

import lombok.NoArgsConstructor;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.Setter;

@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Entity
@Getter
@Setter
@Table(name = "viagem")
public class Viagem {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id")
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "usuario_id", nullable = false)
    private Usuario usuario;

    @Column(name = "nome_cliente", nullable = false, length = 150)
    private String nomeCliente;

    @Column(name = "destino", nullable = false, length = 150)
    private String destino;

    @Column(name = "local_partida", nullable = false, length = 150)
    private String localPartida;

    @Column(name = "data_partida", nullable = false)
    private LocalDate data_partida;

    @Column(name = "horario_partida", nullable = false)
    private LocalTime horarioPartida;

    @Column(name = "valor_cobrado", nullable = false, precision = 10, scale = 2)
    private BigDecimal valorCobrado;

    @Column(columnDefinition = "TEXT")
    private String observacoes;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private StatusViagem statusViagem = StatusViagem.AGENDADA;

    @Column(name = "avaliacao")
    private Integer avaliacao;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime created_at;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updated_at;

    public Viagem(Usuario usuario, String nomeCliente, String destino, String localPartida,
                  LocalDate data_partida, LocalTime horarioPartida, BigDecimal valorCobrado,
                  String observacoes) {
        this.usuario = usuario;
        this.nomeCliente = nomeCliente;
        this.destino = destino;
        this.localPartida = localPartida;
        this.data_partida = data_partida;
        this.horarioPartida = horarioPartida;
        this.valorCobrado = valorCobrado;
        this.observacoes = observacoes;
    }

    @PrePersist
    protected void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        this.created_at = now;
        this.updated_at = now;
    }

    @PreUpdate
    protected void onUpdate() {
        this.updated_at = LocalDateTime.now();
    }
}
