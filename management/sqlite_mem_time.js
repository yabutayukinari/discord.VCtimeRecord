require('dotenv').config()
const Discord = require('discord.js');
const sqlite = require('sqlite3').verbose();

const env = process.env;
const TOKEN = env.CRON_BOT_TOKEN;
const client = new Discord.Client();
const db = new sqlite.Database('/home/ec2-user/sqlite3/mokumoku_online_studyroom.sqlite3');

// ログイン
client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
});

// 全て取得
const select_all = () => {
    db.each('SELECT * FROM mem_time;', (error, row) => {
        if(error) {
            console.error('Error!', error);
            return;
        }
        console.log('row',row);
    });
}
// 見やすさ重視の理想形
//   userid,
//   username,
//   guild_join_datetime,
//   voicechannel_lastjoin_datetime,
//   voicechannel_lastleave_datetime,
//   message_lastsent_datetime
//   ) VALUES (
//   ${id},
//   '${name}',
//   '${guild_join_datetime}',
//   '${voicechannel_lastjoin_datetime}',
//   '${voicechannel_lastleave_datetime}',
//   '{message_lastsent_datetime}',
//`};


//unixtime(ms)をDate型(YYYY-MM-DD hh:mm:dd)に変換する
const unixtimemsfDate = (unixtime_ms) => {
    var d = new Date(parseInt(unixtime_ms,10));
    var year = d.getFullYear();
    var month = ( ( d.getMonth() + 1 ) < 10 ) ? '0' + (d.getMonth() + 1) : d.getMonth() + 1;
    var day  = ( d.getDate() < 10 ) ? '0' + d.getDate() : d.getDate();
    var hour = ( d.getHours()   < 10 ) ? '0' + d.getHours()   : d.getHours();
    var min  = ( d.getMinutes() < 10 ) ? '0' + d.getMinutes() : d.getMinutes();
    var sec   = ( d.getSeconds() < 10 ) ? '0' + d.getSeconds() : d.getSeconds();
    let user_datetime = year + '-' + month + '-' + day + ' ' + hour + ':' + min + ':' + sec ;
    return user_datetime;
}


// データゼロ想定の書き込み
const insert_member = (userid, username, guild_join_datetime) => {
    db.serialize(() => {
        db.each("SELECT * FROM mem_time WHERE userid = ? and username = ?",[userid,username],(error, row) => {
            if(error){
                console.log('Error!:', error);
                return;
            }
        }, (error, count) => {  //←complete処理追加
            //SQL実行直後に上のコールバック処理が走る前にここが処理されるで。
            if (error){
                //エラー処理
                console.log('Error!:', error);
            }else{
                if (count == 0){
                    //ここでSQLの実行結果が0件の処理や
                    let sql = db.prepare(
                        "INSERT INTO mem_time(userid, username,guild_join_datetime) VALUES(?,?,?)",
                        userid, username, guild_join_datetime,
                        );
                    sql.run();
                    console.log(`${userid}(${username})を新規追加(INSERT)しました`);
                }else{
                    let sql = db.prepare(
                        "UPDATE mem_time SET guild_join_datetime = ? WHERE userid = ?",
                        guild_join_datetime, userid
                        );
                    sql.run();
                    console.log(`${userid}(${username})を更新(UPDATE)しました`);
                    console.log(`guild_join_datetime: ${guild_join_datetime}`);
                }
            }
        });
//ここをコメントすることで「Segmentation fault」エラーがなくなって書き込めた
//        db.close(
//            function(err) {
//                if (err) {
//                    console.error(err.message);
//                }
//                else {
//                    console.log("db Close.");
//                }
//            }
//        );
    });
} 
// 送信されたメッセージをトリガーに処理開始
client.on('message', message => {
    let channel = message.channel;
    let author = message.author.username;
    if(message.content === '¥all_insert_jointime') {
        console.log('---command---');
        const members = message.guild.members.cache.keyArray();
        members.forEach(function(value) {
            const name = message.guild.members.cache.get(value);
            insert_member(
                name.user.id,
                name.user.username,
                unixtimemsfDate(name.joinedTimestamp)
            )
            console.log('------------------------')
            console.log('name.user.id: ',name.user.id);
            console.log('name.user.username: ',name.user.username);
            console.log('name.joinedTimestamp: ',name.joinedTimestamp);
//    // メッセージへリアクション
//    message.reply(reply_text)
//        .then(message => console.log(`Sent message: ${reply_text}`))
//        .catch(console.error);
//    message.delete({ timeout: 1000 })
//    return;
        });
    }
});

client.login(TOKEN);
