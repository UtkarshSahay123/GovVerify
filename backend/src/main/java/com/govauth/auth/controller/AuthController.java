package com.govauth.auth.controller;

import com.govauth.auth.dto.LoginRequest;
import com.govauth.auth.dto.SignupRequest;
import com.govauth.auth.model.User;
import com.govauth.auth.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*") // For development
public class AuthController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @PostMapping("/signup")
    public ResponseEntity<?> registerUser(@RequestBody SignupRequest signupRequest) {
        System.out.println("Signup Attempt: Username=" + signupRequest.getUsername() + ", Email=" + signupRequest.getEmail());
        
        if (userRepository.findByUsername(signupRequest.getUsername()).isPresent()) {
            return ResponseEntity.badRequest().body("Error: Username is already taken!");
        }

        if (userRepository.findByEmail(signupRequest.getEmail()).isPresent()) {
            return ResponseEntity.badRequest().body("Error: Email is already in use!");
        }

        // Create new user's account
        User user = new User();
        user.setFullName(signupRequest.getFullName());
        user.setEmail(signupRequest.getEmail());
        user.setUsername(signupRequest.getUsername());
        user.setPassword(passwordEncoder.encode(signupRequest.getPassword()));
        user.setRole(signupRequest.getRole());
        user.setIdentifier(signupRequest.getIdentifier());

        userRepository.save(user);
        System.out.println("User Registered: " + user.getUsername() + " with Role: " + user.getRole());

        return ResponseEntity.ok("User registered successfully!");
    }

    @PostMapping("/login")
    public ResponseEntity<?> authenticateUser(@RequestBody LoginRequest loginRequest) {
        System.out.println("Login Attempt: User=" + loginRequest.getUsername() + ", Role=" + loginRequest.getRole());
        
        Optional<User> userOpt = userRepository.findByUsername(loginRequest.getUsername());

        if (userOpt.isPresent()) {
            User user = userOpt.get();
            System.out.println("User Found in DB: " + user.getUsername() + " with Role: " + user.getRole());
            
            boolean passwordMatches = passwordEncoder.matches(loginRequest.getPassword(), user.getPassword());
            System.out.println("Password Match: " + passwordMatches);
            
            if (passwordMatches) {
                if (user.getRole().equalsIgnoreCase(loginRequest.getRole())) {
                    System.out.println("Login Success for user: " + loginRequest.getUsername());
                    return ResponseEntity.ok("Login successful! Role: " + user.getRole());
                } else {
                    System.out.println("Role Mismatch: DB=" + user.getRole() + ", Req=" + loginRequest.getRole());
                    return ResponseEntity.status(403).body("Error: Role mismatch for this user.");
                }
            } else {
                System.out.println("Password Mismatch for user: " + loginRequest.getUsername());
            }
        } else {
            System.out.println("User Not Found in DB: " + loginRequest.getUsername());
        }

        return ResponseEntity.status(401).body("Error: Invalid username or password!");
    }
}
