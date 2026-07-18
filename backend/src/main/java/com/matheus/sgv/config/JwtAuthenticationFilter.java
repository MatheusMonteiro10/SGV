package com.matheus.sgv.config;

import com.matheus.sgv.model.Usuario;
import com.matheus.sgv.repository.UsuarioRepository;
import com.matheus.sgv.service.JwtService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Collections;
import java.util.UUID;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private static final Logger log = LoggerFactory.getLogger(JwtAuthenticationFilter.class);

    private final JwtService jwtService;
    private final UsuarioRepository usuarioRepository;

    public JwtAuthenticationFilter(JwtService jwtService, UsuarioRepository usuarioRepository) {
        this.jwtService = jwtService;
        this.usuarioRepository = usuarioRepository;
    }

    @Override
    protected void doFilterInternal(@NonNull HttpServletRequest request,
                                    @NonNull HttpServletResponse response,
                                    @NonNull FilterChain filterChain) throws ServletException, IOException {

        String authHeader = request.getHeader("Authorization");

        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7);

            if (jwtService.tokenValido(token)) {
                UUID usuarioId = UUID.fromString(jwtService.extrairUsuarioId(token));
                usuarioRepository.findById(usuarioId).ifPresentOrElse(
                        usuario -> autenticar(usuario, request),
                        () -> log.warn("Token válido, mas usuário {} não existe mais", usuarioId)
                );
            } else {
                log.warn("Token JWT inválido ou expirado recebido");
            }
        }

        filterChain.doFilter(request, response);
    }

    private void autenticar(Usuario usuario, HttpServletRequest request) {
        var authentication = new UsernamePasswordAuthenticationToken(usuario, null, Collections.emptyList());
        SecurityContextHolder.getContext().setAuthentication(authentication);
    }
}