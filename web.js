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

// 이벤트 참여 데이터를 클라이언트로 보내는 API
app.get('/getEventData', async (req, res) => {
    try {
        const db = await connectToDatabase();
        const collection = db.collection('EventChoice');
        
        // MongoDB에서 모든 참여자 데이터를 가져옴
        const participants = await collection.find({}).toArray();

        // 데이터를 클라이언트로 전송
        res.status(200).json(participants);
    } catch (error) {
        console.error('데이터 조회 중 오류 발생:', error);
        res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    }
});

// 참여자 정보를 저장하는 API (주문번호 추가)
app.get('/getEventData', async (req, res) => {
    try {
        const db = await connectToDatabase();
        const collection = db.collection('EventChoice');

        // 주문번호가 중복될 경우 가장 빠른 시간의 데이터만 가져오는 쿼리
        const participants = await collection.aggregate([
            { $sort: { order_number: 1, participation_time: 1 } }, // 주문번호와 참여 시간을 기준으로 오름차순 정렬
            {
                $group: {
                    _id: "$order_number", // 주문번호로 그룹화
                    member_id: { $first: "$member_id" }, // 가장 빠른 시간의 회원 ID 선택
                    name: { $first: "$name" }, // 가장 빠른 시간의 이름 선택
                    phone: { $first: "$phone" }, // 가장 빠른 시간의 전화번호 선택
                    participation_time: { $first: "$participation_time" }, // 가장 빠른 시간의 참여 시간 선택
                    order_number: { $first: "$order_number" } // 주문번호
                }
            }
        ]).toArray();

        // 클라이언트로 필터링된 데이터를 전송
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
