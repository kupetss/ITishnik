// Форма обратной связи
const phoneInput = document.getElementById('phone')
if (phoneInput) {
	phoneInput.addEventListener('input', function (e) {
		let value = e.target.value.replace(/\D/g, '')
		if (value.length > 0 && value[0] !== '7') {
			value = '7' + value
		}
		let formattedValue = ''
		if (value.length > 0) {
			formattedValue = '+' + value[0]
		}
		if (value.length > 1) {
			formattedValue += ' (' + value.substring(1, 4)
		}
		if (value.length > 4) {
			formattedValue += ') ' + value.substring(4, 7)
		}
		if (value.length > 7) {
			formattedValue += '-' + value.substring(7, 9)
		}
		if (value.length > 9) {
			formattedValue += '-' + value.substring(9, 11)
		}
		e.target.value = formattedValue
	})
}

// Обработка формы
document.querySelector('.feedback__form__btn').addEventListener('click', async function(e) {
    e.preventDefault();
    
    const formData = {
        name: document.querySelector('.feedback__form__name input').value,
        email: document.querySelector('.feedback__form__email input').value,
        phone: document.querySelector('.feedback__form__phone input').value,
        'selected-course': document.getElementById('selected-course').textContent
    };

    try {
        const response = await fetch('/submit', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams(formData).toString()
        });

        if (response.ok) {
            alert('Спасибо! Мы отправили вам письмо с подтверждением.');
        } else {
            alert('Произошла ошибка при отправке формы.');
        }
    } catch (error) {
        console.error('Ошибка:', error);
        alert('Произошла ошибка при отправке формы.');
    }
});

// Курсы
// Создание карточки
function createCard(course) {
	const cartItemHTML = `
      <div class="courses__card" data-id="${course.id}">
          <div class="courses__card__img" style="background-color: ${course.background};">
              <img src="${course.img}" alt="${course.title}">
          </div>
          <div class="courses__card__desc">
              <div class="courses__card__title">${course.title}</div>
              <div class="courses__card__text">${course.text}</div>
              <div class="courses__card__info">
                  <div class="courses__card__level">${course.level}</div>
                  <button class="courses__card__btn" data-id="${course.id}">${course.detailed}</button>
              </div>
          </div>
      </div>
  `
	return cartItemHTML
}
// Создание модалки
function createModal(course) {
	const modalItemHTML = `
      <div class="modal__header">
          <button class="modal__close">&times;</button>
      </div>
      <div class="courses__modal" data-id="${course.id}">
          <div class="courses__modal__img" style="background-color: ${course.background};">
              <img src="${course.img}" alt="${course.title}">
          </div>
          <div class="courses__modal__desc">
              <div class="courses__modal__title">${course.title}</div>
              <div class="courses__modal__text">${course.details}</div>
          </div>
      </div>
  `
	return modalItemHTML
}

// Отображения всех карточек
function renderCards(courses) {
	const container = document.getElementById('courseGroup')
	courses.forEach(course => {
		const cardHTML = createCard(course)
		container.insertAdjacentHTML('beforeend', cardHTML)
	})
}

function openModal(course) {
	const modal = document.getElementById('modal')
	const modalContent = document.getElementById('modalContent')
	modalContent.innerHTML = createModal(course)
	modal.style.display = 'flex'
	modalContent
		.querySelector('.modal__close')
		.addEventListener('click', closeModal)
	document.body.style.overflow = 'hidden'
}

function closeModal() {
	const modal = document.getElementById('modal')
	modal.style.display = 'none'
	document.body.style.overflow = ''
}

// Асинхронная функция для загрузки данных из courses.json
async function loadCourses() {
	try {
		// Загружаем JSON-файл
		const response = await fetch('./js/courses.json')

		// Проверяем статус ответа
		if (!response.ok) {
			throw new Error(`Ошибка загрузки данных: ${response.status}`)
		}

		// Парсим данные из JSON
		const data = await response.json()
		console.log('Данные из JSON:', data) // Отладка

		// Отображаем карточки
		renderCards(data)

		// Обработчики событий для кнопок "Подробнее →"
		document.addEventListener('click', event => {
			if (event.target.classList.contains('courses__card__btn')) {
				const courseId = event.target.dataset.id
				const course = data.find(item => item.id === Number(courseId))
				if (course) {
					openModal(course)
				}
			}
		})

		// Обработчик для закрытия модального окна
		document.querySelector('.modal').addEventListener('click', event => {
			if (event.target === event.currentTarget) {
				closeModal()
			}
		})
	} catch (error) {
		console.error('Ошибка:', error)
	}
}
document.addEventListener('DOMContentLoaded', () => {
	loadCourses()
})

// Плавный скролл
const anchors = document.querySelectorAll('a[href*="#"]')

for (let anchor of anchors) {
	anchor.addEventListener('click', e => {
		e.preventDefault()
		const blockId = anchor.getAttribute('href')
		document.querySelector('' + blockId).scrollIntoView({
			behavior: 'smooth',
			block: 'start',
		})
	})
}

// Добавьте этот скрипт перед закрывающим тегом </body>
document.addEventListener('DOMContentLoaded', function () {
	const burgerMenu = document.querySelector('.burger-menu')
	const nav = document.querySelector('.nav')
	const menuItems = document.querySelectorAll('.menu-item a')

	// Переключение меню
	burgerMenu.addEventListener('click', function () {
		nav.classList.toggle('active')
		document.body.classList.toggle('no-scroll')
	})

	// Закрытие меню при клике на пункт
	menuItems.forEach(item => {
		item.addEventListener('click', function () {
			if (window.innerWidth <= 767) {
				nav.classList.remove('active')
				document.body.classList.remove('no-scroll')
			}
		})
	})

	// Кнопка "Записаться" в мобильном меню
	const headerBtn = document.querySelector('.header-btn')
	if (window.innerWidth <= 767 && headerBtn) {
		const mobileBtn = headerBtn.cloneNode(true)
		mobileBtn.classList.add('header-btn-mobile')
		document.querySelector('.menu').appendChild(mobileBtn)
		headerBtn.style.display = 'none'
	}
})

//Выпадающий список курсов
document.addEventListener('DOMContentLoaded', function() {
  const customSelects = document.querySelectorAll('.custom-select')
  
  customSelects.forEach(select => {
    const selectedOption = select.querySelector('.selected-option')
    const options = select.querySelectorAll('.dropdown-options li')
    let feedback = document.getElementById('feedback')
    
    select.addEventListener('click', function(e) {
      e.stopPropagation()
      this.classList.toggle('active')
      feedback.style.zIndex = '9999'
      
      customSelects.forEach(otherSelect => {
        if (otherSelect !== this) {
          otherSelect.classList.remove('active')
        }
      })
    })
    
    options.forEach(option => {
      option.addEventListener('click', function() {
        selectedOption.textContent = this.textContent
        select.classList.remove('active')
      })
    })
  })
  
  document.addEventListener('click', function() {
    customSelects.forEach(select => {
      select.classList.remove('active')
    })
  })
})