package io.settler.models;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.math.BigDecimal;
import java.util.Objects;

/**
 * Represents a monetary amount with currency.
 */
public class Money {
    private BigDecimal value;
    private String currency;

    public Money() {
    }

    public Money(BigDecimal value, String currency) {
        this.value = value;
        this.currency = currency;
    }

    public Money(double value, String currency) {
        this.value = BigDecimal.valueOf(value);
        this.currency = currency;
    }

    @JsonProperty("value")
    public BigDecimal getValue() {
        return value;
    }

    public void setValue(BigDecimal value) {
        this.value = value;
    }

    @JsonProperty("currency")
    public String getCurrency() {
        return currency;
    }

    public void setCurrency(String currency) {
        this.currency = currency;
    }

    /**
     * Formats the money as a human-readable string.
     *
     * @return formatted string like "USD 100.00"
     */
    public String format() {
        return String.format("%s %s", currency, value.toPlainString());
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        Money money = (Money) o;
        return Objects.equals(value, money.value) &&
                Objects.equals(currency, money.currency);
    }

    @Override
    public int hashCode() {
        return Objects.hash(value, currency);
    }

    @Override
    public String toString() {
        return "Money{" +
                "value=" + value +
                ", currency='" + currency + '\'' +
                '}';
    }
}
