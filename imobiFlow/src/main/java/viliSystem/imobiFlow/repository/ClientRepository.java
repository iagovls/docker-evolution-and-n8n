package viliSystem.imobiFlow.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import viliSystem.imobiFlow.model.Client;

@Repository
public interface ClientRepository extends JpaRepository<Client, Long> {
}
