package mac

import (
	"testing"
)

func TestNew(t *testing.T) {
	_, err := New("00:11:22:33:44:55")
	if err != nil {
		t.Errorf("New() error = %v, wantErr nil", err)
	}

	_, err = New("invalid-mac")
	if err == nil {
		t.Errorf("New() error = nil, wantErr not nil")
	}
}

func TestMAC_ShowHex(t *testing.T) {
	m, _ := New("00:1A:2B:3C:4D:5E")
	want := "00:1a:2b:3c:4d:5e" // net.ParseMAC lowercases the hex characters
	if got := m.ShowHex(); got != want {
		t.Errorf("ShowHex() = %v, want %v", got, want)
	}
}

func TestMAC_ShowOct(t *testing.T) {
	m, _ := New("00:11:22:33:44:55")
	want := "000:021:042:063:104:125"
	if got := m.ShowOct(); got != want {
		t.Errorf("ShowOct() = %v, want %v", got, want)
	}
}

func TestMAC_Increase(t *testing.T) {
	m, _ := New("00:00:00:00:00:ff")
	m.Increase(1)
	want := "00:00:00:00:01:00"
	if got := m.ShowHex(); got != want {
		t.Errorf("Increase() got = %v, want %v", got, want)
	}

	m.Increase(255)
	want = "00:00:00:00:01:ff"
	if got := m.ShowHex(); got != want {
		t.Errorf("Increase() got = %v, want %v", got, want)
	}

	m, _ = New("ff:ff:ff:ff:ff:ff")
	m.Increase(1)
	want = "00:00:00:00:00:00"
	if got := m.ShowHex(); got != want {
		t.Errorf("Increase() overflow got = %v, want %v", got, want)
	}
}

func TestMAC_Decrease(t *testing.T) {
	m, _ := New("00:00:00:00:01:00")
	m.Decrease(1)
	want := "00:00:00:00:00:ff"
	if got := m.ShowHex(); got != want {
		t.Errorf("Decrease() got = %v, want %v", got, want)
	}

	m.Decrease(255)
	want = "00:00:00:00:00:00"
	if got := m.ShowHex(); got != want {
		t.Errorf("Decrease() got = %v, want %v", got, want)
	}

	m, _ = New("00:00:00:00:00:00")
	m.Decrease(1)
	want = "ff:ff:ff:ff:ff:ff"
	if got := m.ShowHex(); got != want {
		t.Errorf("Decrease() underflow got = %v, want %v", got, want)
	}
}
