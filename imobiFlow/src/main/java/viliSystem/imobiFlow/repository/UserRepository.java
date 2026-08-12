package viliSystem.imobiFlow.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import viliSystem.imobiFlow.model.User;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
}
