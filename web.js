const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { MongoClient } = require('mongodb');
const dotenv = require('dotenv');

// 환경 변수 설정
dotenv.config();

// Express 앱 초기화
const app = express();

// 미들웨어 설정
app.use(cors());
app.use(bodyParser.json());

// MongoDB 연결 설정
const uri = process.env.MONGO_URI;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

// MongoDB 연결 및 데이터베이스 가져오기
async function connectToDatabase() {
    try {
        await client.connect();
        console.log('MongoDB에 성공적으로 연결되었습니다.');
        return client.db('members');  // 'members' 데이터베이스 선택 (없으면 자동 생성)
    } catch (error) {
        console.error('MongoDB 연결 오류:', error);
        throw error;
    }
}

// API 라우트 설정
app.post('/eventData', async (req, res) => {
    const { member_id, phone, name } = req.body;
    const currentTime = new Date();  // 현재 시간 (UTC 기준)

    try {
        const db = await connectToDatabase();
        const collection = db.collection('EventChoice');

        // 중복 확인 없이 새 회원 정보 저장 (member_id, phone, name, 참여 시각)
        await collection.insertOne({
            member_id,
            phone,
            name,
            participation_time: currentTime  // UTC 시간으로 참여 시각 저장
        });
        res.status(200).json({ message: '회원 정보가 성공적으로 저장되었습니다.' });
    } catch (error) {
        console.error('저장 중 오류 발생:', error);
        res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    }
});

app.get('/eventChoice', async (req, res) => {
    try {
        const db = await connectToDatabase();
        const collection = db.collection('EventChoice');  // 여기서 컬렉션 이름을 'EventChoice'로 수정
        
        // MongoDB에서 모든 참여자 데이터를 가져옴
        const participants = await collection.find({}).toArray();

        res.status(200).json(participants);
    } catch (error) {
        console.error('데이터 조회 중 오류 발생:', error);
        res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    }
});

// 서버 시작
const port = process.env.PORT || 5000;
app.listen(port, () => {
    console.log(`서버가 http://localhost:${port} 에서 실행 중입니다.`);
});
