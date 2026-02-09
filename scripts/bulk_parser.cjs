const fs = require('fs');
const path = require('path');

try {
    const filePath = path.join(__dirname, 'result.json');
    if (!fs.existsSync(filePath)) {
        console.error("❌ Файл result.json не найден!");
        process.exit(1);
    }

    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

    // Ищем чат TildaForms в списке экспортированных чатов
    const tildaChat = data.chats.list.find(chat => chat.name === 'TildaForms');

    if (!tildaChat || !tildaChat.messages) {
        console.error("❌ Не удалось найти чат 'TildaForms' или сообщения в нем.");
        process.exit(1);
    }

    const parsedReviews = [];

    tildaChat.messages.forEach(msg => {
        // Telegram сохраняет текст либо строкой, либо массивом объектов (entities)
        let text = "";
        if (Array.isArray(msg.text)) {
            text = msg.text.map(part => typeof part === 'string' ? part : part.text).join('');
        } else {
            text = msg.text || "";
        }

        // Ищем только сообщения-заявки
        if (text.includes("Name:") && (text.includes("Содержание заявки") || text.includes("Request details"))) {
            const name = (text.match(/Name:\s*(.*)/i) || [])[1]?.trim() || "Аноним";
            const email = (text.match(/(?:Email|Input):\s*([^\s\n]*)/i) || [])[1]?.trim() || "empty@mail.ru";
            const message = (text.match(/Textarea:\s*([\s\S]*?)(?=File:|Checkbox:|Additional information:|Дополнительная информация:|$)/i) || [])[1]?.trim() || "";
            const file = (text.match(/File:\s*(.*)/i) || [])[1]?.trim() || "";

            if (message) {
                parsedReviews.push({
                    id: `tg-${msg.id}`,
                    review_name: name,
                    review_email: email,
                    review_message: message,
                    review_image_url: file,
                    review_phone_full: "+7771234567", // Ваш дефолт
                    review_rating: "5",
                    review_date: msg.date
                });
            }
        }
    });

    // Создаем папку если нет
    const outDir = path.join(__dirname, 'src', 'data');
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

    fs.writeFileSync(path.join(outDir, 'tg_archive.json'), JSON.stringify(parsedReviews, null, 2));

    console.log(`✅ Успех!`);
    console.log(`🚀 Найдено и распарсено отзывов: ${parsedReviews.length}`);
    console.log(`📂 База создана в: src/data/tg_archive.json`);

} catch (err) {
    console.error("❌ Ошибка:", err.message);
}