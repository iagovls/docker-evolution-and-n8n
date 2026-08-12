package viliSystem.imobiFlow.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import viliSystem.imobiFlow.model.PropertyImage;

@Repository
public interface PropertyImageRepository extends JpaRepository<PropertyImage, Long> {

    List<PropertyImage> findByPropertyIdOrderByDisplayOrder(Long propertyId);

    List<PropertyImage> findByPropertyIdAndIsOriginalTrue(Long propertyId);
}
