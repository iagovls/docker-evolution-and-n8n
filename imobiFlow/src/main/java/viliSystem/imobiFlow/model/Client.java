package viliSystem.imobiFlow.model;

import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.GenerationType;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import jakarta.persistence.Entity;

@Entity
@lombok.Data
@lombok.NoArgsConstructor
@lombok.AllArgsConstructor

public class Client {
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private Long id;
    
    @NotBlank(message = "Name is mandatory")
    @Size(min = 3, max = 100, message = "Name must be between 3 and 100 characters")
    private String name;
    
    @NotBlank(message = "Email is mandatory")
    @Size(min = 5, max = 100, message = "Email must be between 5 and 100 characters")
    @Email(message = "Email must be a valid email address")
    private String email;
    
    @NotBlank(message = "Phone is mandatory")
    @Size(min = 10, max = 15, message = "Phone must be between 10 and 15 characters")
    private String phone;
    
    @NotBlank(message = "Address is mandatory")
    @Size(min = 5, max = 200, message = "Address must be between 5 and 200 characters")
    private String address;
    
    @NotBlank(message = "City is mandatory")
    @Size(min = 3, max = 50, message = "City must be between 3 and 50 characters")
    private String city;
    
    @NotBlank(message = "State is mandatory")
    @Size(min = 2, max = 5, message = "State must be between 2 and 5 characters")
    private String state;
    
    @NotBlank(message = "Zip is mandatory")
    @Size(min = 5, max = 10, message = "Zip must be between 5 and 10 characters")
    private String zip;
    
}
