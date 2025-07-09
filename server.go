package main

import (
	"bytes"
	"crypto/tls"
	"fmt"
	"html/template"
	"log"
	"net/http"
	"os"
	"time"

	"github.com/joho/godotenv"
	"gopkg.in/gomail.v2"
)

type FormData struct {
	Name   string
	Email  string
	Phone  string
	Course string
}

func redirectToHTTPS(w http.ResponseWriter, r *http.Request) {
	http.Redirect(w, r, "https://"+r.Host+r.RequestURI, http.StatusMovedPermanently)
}

func homeH(w http.ResponseWriter, r *http.Request) {
	if r.TLS == nil {
		redirectToHTTPS(w, r)
		return
	}
	http.ServeFile(w, r, "index.html")
}

func submitH(w http.ResponseWriter, r *http.Request) {
	if r.TLS == nil {
		redirectToHTTPS(w, r)
		return
	}

	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	err := r.ParseForm()
	if err != nil {
		http.Error(w, "Bad request", http.StatusBadRequest)
		return
	}

	data := FormData{
		Name:   r.FormValue("name"),
		Email:  r.FormValue("email"),
		Phone:  r.FormValue("phone"),
		Course: r.FormValue("selected-course"),
	}

	if data.Email == "" || data.Phone == "" {
		http.Error(w, "Email and phone are required", http.StatusBadRequest)
		return
	}

	err = sendEmail(data, data.Email, "Спасибо за обращение в ITишник!")
	if err != nil {
		log.Printf("Ошибка отправки письма пользователю: %v", err)
	}

	err = sendEmail(data, "studiorepeet23@mail.ru", "Новая заявка с сайта")
	if err != nil {
		log.Printf("Ошибка отправки письма администратору: %v", err)
	}

	w.Header().Set("Content-Type", "application/json")
	fmt.Fprintf(w, `{"success": true, "message": "Письмо отправлено успешно!"}`)
}

func sendEmail(data FormData, to string, subject string) error {
	htmlContent, err := os.ReadFile("email.html")
	if err != nil {
		return fmt.Errorf("не удалось прочитать файл email.html: %v", err)
	}

	recipientType := "user"
	if to == "studiorepeet23@mail.ru" {
		recipientType = "admin"
	}

	templateData := struct {
		FormData
		RecipientType string
		CurrentTime   string
	}{
		FormData:      data,
		RecipientType: recipientType,
		CurrentTime:   time.Now().Format("2006-01-02 15:04:05"),
	}

	tmpl, err := template.New("email").Parse(string(htmlContent))
	if err != nil {
		return fmt.Errorf("ошибка парсинга шаблона: %v", err)
	}

	var body bytes.Buffer
	err = tmpl.Execute(&body, templateData)
	if err != nil {
		return fmt.Errorf("ошибка выполнения шаблона: %v", err)
	}

	m := gomail.NewMessage()
	m.SetHeader("From", "itshnik33@mail.ru")
	m.SetHeader("To", to)
	m.SetHeader("Subject", subject)
	m.SetBody("text/html", body.String())

	password := os.Getenv("MAILRU_PASSWORD")
	if password == "" {
		return fmt.Errorf("не задан пароль от почты в переменных окружения")
	}

	d := gomail.NewDialer("smtp.mail.ru", 465, "itshnik33@mail.ru", password)

	if err := d.DialAndSend(m); err != nil {
		return fmt.Errorf("не удалось отправить письмо: %v", err)
	}

	return nil
}

func main() {
	err := godotenv.Load()
	if err != nil {
		log.Printf("Ошибка загрузки .env файла: %v", err)
	}

	go func() {
		http.HandleFunc("/", redirectToHTTPS)
		log.Fatal(http.ListenAndServe(":80", nil))
	}()

	http.HandleFunc("/", homeH)
	http.HandleFunc("/submit", submitH)

	http.Handle("/css/", http.StripPrefix("/css/", http.FileServer(http.Dir("css"))))
	http.Handle("/img/", http.StripPrefix("/img/", http.FileServer(http.Dir("img"))))
	http.Handle("/js/", http.StripPrefix("/js/", http.FileServer(http.Dir("js"))))

	port := os.Getenv("PORT")
	if port == "" {
		port = "443"
	}
	
	cfg := &tls.Config{
		MinVersion:               tls.VersionTLS12,
		CurvePreferences:         []tls.CurveID{tls.CurveP521, tls.CurveP384, tls.CurveP256},
		PreferServerCipherSuites: true,
		CipherSuites: []uint16{
			tls.TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384,
			tls.TLS_ECDHE_RSA_WITH_AES_256_CBC_SHA,
			tls.TLS_RSA_WITH_AES_256_GCM_SHA384,
			tls.TLS_RSA_WITH_AES_256_CBC_SHA,
		},
	}

	srv := &http.Server{
		Addr:         ":" + port,
		Handler:      nil,
		TLSConfig:    cfg,
		TLSNextProto: make(map[string]func(*http.Server, *tls.Conn, http.Handler), 0),
	}

	log.Printf("Сервер запущен на порту %s (HTTPS)", port)
	log.Fatal(srv.ListenAndServeTLS("/etc/letsencrypt/live/itshnik.site/fullchain.pem", "/etc/letsencrypt/live/itshnik.site/privkey.pem"))
}
