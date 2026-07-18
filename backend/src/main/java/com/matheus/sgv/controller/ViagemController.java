package com.matheus.sgv.controller;

import com.matheus.sgv.dto.viagem.ViagemRequest;
import com.matheus.sgv.dto.viagem.ViagemResponse;
import com.matheus.sgv.dto.viagem.AvaliacaoRequest;
import com.matheus.sgv.model.Usuario;
import com.matheus.sgv.model.Viagem;
import com.matheus.sgv.model.enums.StatusViagem;
import com.matheus.sgv.service.ViagemService;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/viagens")
public class ViagemController {

    private final ViagemService viagemService;

    public ViagemController(ViagemService viagemService) {
        this.viagemService = viagemService;
    }

    @PostMapping
    public ResponseEntity<ViagemResponse> registrar(@Valid @RequestBody ViagemRequest request,
                                                    @AuthenticationPrincipal Usuario usuario) {
        Viagem viagem = viagemService.registrar(
                usuario,
                request.nomeCliente(),
                request.destino(),
                request.localPartida(),
                request.dataPartida(),
                request.horarioPartida(),
                request.valorCobrado(),
                request.observacoes());

        return ResponseEntity.status(HttpStatus.CREATED).body(ViagemResponse.from(viagem));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ViagemResponse> buscarPorId(@PathVariable UUID id,
                                                      @AuthenticationPrincipal Usuario usuario) {
        Viagem viagem = viagemService.buscarPorId(id, usuario);
        return ResponseEntity.ok(ViagemResponse.from(viagem));
    }

    @GetMapping
    public ResponseEntity<List<ViagemResponse>> listarHistorico(@AuthenticationPrincipal Usuario usuario) {
        List<ViagemResponse> viagens = viagemService.listarHistorico(usuario).stream()
                .map(ViagemResponse::from)
                .toList();
        return ResponseEntity.ok(viagens);
    }

    @GetMapping("/periodo")
    public ResponseEntity<List<ViagemResponse>> listarPorPeriodo(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate inicio,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fim,
            @AuthenticationPrincipal Usuario usuario) {

        List<ViagemResponse> viagens = viagemService.listarPorPeriodo(usuario, inicio, fim).stream()
                .map(ViagemResponse::from)
                .toList();
        return ResponseEntity.ok(viagens);
    }

    @GetMapping("/status/{status}")
    public ResponseEntity<List<ViagemResponse>> listarPorStatus(@PathVariable StatusViagem status,
                                                                @AuthenticationPrincipal Usuario usuario) {
        List<ViagemResponse> viagens = viagemService.listarPorStatus(usuario, status).stream()
                .map(ViagemResponse::from)
                .toList();
        return ResponseEntity.ok(viagens);
    }

    @GetMapping("/dashboard")
    public ResponseEntity<List<ViagemResponse>> listarParaDashboard(
            @RequestParam StatusViagem status,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate inicio,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fim,
            @AuthenticationPrincipal Usuario usuario) {

        List<ViagemResponse> viagens = viagemService.listarParaDashboard(usuario, status, inicio, fim).stream()
                .map(ViagemResponse::from)
                .toList();
        return ResponseEntity.ok(viagens);
    }

    @PatchMapping("/{id}/concluir")
    public ResponseEntity<ViagemResponse> concluir(@PathVariable UUID id,
                                                   @AuthenticationPrincipal Usuario usuario) {
        Viagem viagem = viagemService.atualizarStatus(id, usuario, StatusViagem.CONCLUIDA);
        return ResponseEntity.ok(ViagemResponse.from(viagem));
    }

    @PatchMapping("/{id}/avaliacao")
    public ResponseEntity<ViagemResponse> avaliar(@PathVariable UUID id,
                                                  @Valid @RequestBody AvaliacaoRequest request,
                                                  @AuthenticationPrincipal Usuario usuario) {
        Viagem viagem = viagemService.avaliar(id, usuario, request.nota());
        return ResponseEntity.ok(ViagemResponse.from(viagem));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> remover(@PathVariable UUID id, @AuthenticationPrincipal Usuario usuario) {
        viagemService.remover(id, usuario);
        return ResponseEntity.noContent().build();
    }
}