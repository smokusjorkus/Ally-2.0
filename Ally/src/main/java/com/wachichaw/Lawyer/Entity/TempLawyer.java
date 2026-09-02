package com.wachichaw.Lawyer.Entity;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.stereotype.Service;

import com.wachichaw.Client.Entity.ClientEntity;
import com.wachichaw.Lawyer.Entity.LawyerEntity;

@Service
public class TempLawyer{
    private final Map<String, LawyerEntity> unverifiedUsers = new ConcurrentHashMap<>();

    public void saveUnverifiedUser(String token, LawyerEntity user) {
        unverifiedUsers.put(token, user);
    }

    public LawyerEntity getUnverifiedUser(String token) {
        LawyerEntity user = unverifiedUsers.get(token);
        System.out.println("Retrieved user: " + (user != null ? user.getEmail() : "null"));
        return user;
    }
  
    public String getTokenByEmail(String email) {
    for (Map.Entry<String, LawyerEntity> entry : unverifiedUsers.entrySet()) {
        if (entry.getValue().getEmail().equalsIgnoreCase(email)) {
            return entry.getKey();
        }
    }
    return null;
}

    public void removeUnverifiedUser(String token) {
        unverifiedUsers.remove(token);
    }
}