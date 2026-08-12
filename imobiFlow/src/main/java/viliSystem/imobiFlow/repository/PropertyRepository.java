package viliSystem.imobiFlow.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import viliSystem.imobiFlow.model.Property;

@Repository
public interface PropertyRepository extends JpaRepository<Property, Short> {
}
