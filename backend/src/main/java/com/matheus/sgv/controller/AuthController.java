package com.matheus.sgv.controller;

import com.matheus.sgv.dto.MensagemResponse;
import com.matheus.sgv.dto.auth.LoginRequest;
import com.matheus.sgv.dto.auth.LoginResponse;
import com.matheus.sgv.dto.auth.ReenvioConfirmacaoRequest;
import com.matheus.sgv.dto.auth.RedefinirSenhaRequest;
import com.matheus.sgv.model.enums.TipoCodigoVerificacao;
import com.matheus.sgv.dto.auth.RegistroRequest;
import com.matheus.sgv.dto.auth.VerificacaoEmailRequest;
import com.matheus.sgv.dto.auth.ConfirmarRedefinicaoSenhaRequest;
import com.matheus.sgv.dto.usuario.UsuarioResponse;
import com.matheus.sgv.dto.auth.GoogleLoginRequest;
import com.matheus.sgv.model.Usuario;
import com.matheus.sgv.service.AuthService;
import com.matheus.sgv.service.JwtService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;
    private final JwtService jwtService;

    public AuthController(AuthService authService, JwtService jwtService) {
        this.authService = authService;
        this.jwtService = jwtService;
    }

    @PostMapping("/registro")
    public ResponseEntity<MensagemResponse> registrar(@Valid @RequestBody RegistroRequest request) {
        authService.registrarLocal(request.nome(), request.email(), request.senha(), request.confirmacaoSenha());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(new MensagemResponse("Cadastro realizado. Verifique seu e-mail para confirmar a conta."));
    }

    @PostMapping("/verificar-email")
    public ResponseEntity<MensagemResponse> verificarEmail(@Valid @RequestBody VerificacaoEmailRequest request) {
        authService.verificarEmail(request.email(), request.codigo());
        return ResponseEntity.ok(new MensagemResponse("E-mail verificado com sucesso."));
    }

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@Valid @RequestBody LoginRequest request) {
        Usuario usuario = authService.login(request.email(), request.senha());
        String token = jwtService.gerarToken(usuario);
        LoginResponse response = new LoginResponse(token, UsuarioResponse.from(usuario));
        return ResponseEntity.ok(response);
    }

    @PostMapping("/reenviar-codigo-registro")
    public ResponseEntity<MensagemResponse> reenviarCodigoRegistro(@Valid @RequestBody ReenvioConfirmacaoRequest request) {
        authService.reenviarCodigo(request.email(), TipoCodigoVerificacao.REGISTRO);
        return ResponseEntity.ok(new MensagemResponse("Novo código enviado."));
    }

    @PostMapping("/esqueci-senha")
    public ResponseEntity<MensagemResponse> esqueciSenha(@Valid @RequestBody RedefinirSenhaRequest request) {
        authService.reenviarCodigo(request.email(), TipoCodigoVerificacao.RESET_SENHA);
        return ResponseEntity.ok(new MensagemResponse("Se o e-mail existir, um código foi enviado."));
    }

    @PostMapping("/redefinir-senha")
    public ResponseEntity<MensagemResponse> redefinirSenha(@Valid @RequestBody ConfirmarRedefinicaoSenhaRequest request) {
        authService.redefinirSenha(request.email(), request.codigo(), request.novaSenha(), request.confirmacaoNovaSenha());
        return ResponseEntity.ok(new MensagemResponse("Senha redefinida com sucesso."));
    }

    @PostMapping("/google")
    public ResponseEntity<LoginResponse> autenticarGoogle(@Valid @RequestBody GoogleLoginRequest request) {
        Usuario usuario = authService.autenticarOuRegistrarGoogle(request.idToken());
        String token = jwtService.gerarToken(usuario);
        LoginResponse response = new LoginResponse(token, UsuarioResponse.from(usuario));
        return ResponseEntity.ok(response);
    }
}