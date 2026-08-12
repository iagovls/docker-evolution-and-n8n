package viliSystem.imobiFlow.model;

import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;

@Entity
@Table(name = "imoveis", schema = "pierre")
@lombok.Data
@lombok.NoArgsConstructor
@lombok.AllArgsConstructor
public class Property {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Short id;

    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt;

    @Column(name = "imv_codigo", nullable = false, unique = true)
    private String code;

    @Column(name = "titulo")
    private String title;

    @Column(name = "fonte_url")
    private String sourceUrl;

    @Column(name = "atualizado_em")
    private OffsetDateTime updatedAt;

    @Column(name = "tipo", nullable = false)
    private String type;

    @Column(name = "finalidade", nullable = false)
    private String purpose;

    @Column(name = "uf", nullable = false)
    private String state;

    @Column(name = "cidade", nullable = false)
    private String city;

    @Column(name = "regiao_cidade")
    private String cityRegion;

    @Column(name = "bairro")
    private String neighborhood;

    @Column(name = "endereco")
    private String address;

    @Column(name = "preco")
    private Integer price;

    @Column(name = "preco_mensal")
    private Boolean monthlyPrice;

    @Column(name = "condominio_preco")
    private Float condominiumFee;

    @Column(name = "iptu_preco")
    private Float propertyTax;

    @Column(name = "area_util_m2")
    private Float usableAreaM2;

    @Column(name = "area_total_m2")
    private Float totalAreaM2;

    @Column(name = "quartos")
    private Short bedrooms;

    @Column(name = "suites")
    private Short suites;

    @Column(name = "banheiros")
    private Short bathrooms;

    @Column(name = "vagas_carro")
    private Short parkingSpaces;

    @Column(name = "andar")
    private Short floor;

    @Column(name = "ano")
    private Short year;

    @Column(name = "mobiliado")
    private String furnished;

    @Column(name = "aceita_pet")
    private Boolean acceptsPet;

    @OneToMany(mappedBy = "property", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<PropertyImage> images = new ArrayList<>();

    @Column(name = "destaques")
    private String highlights;

    @Column(name = "comodidades")
    private String amenities;

    @Column(name = "proximidades")
    private String nearbyPlaces;

    @Column(name = "condicoes")
    private String conditions;

    @Column(name = "restricoes")
    private String restrictions;
}
