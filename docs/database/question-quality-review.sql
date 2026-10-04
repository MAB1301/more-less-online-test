-- Run as database owner. These aggregates are never exposed to ordinary players.
select evidence,game,mode,review_status,count(*) as questions,sum(answers) as answers
from ml_private.question_difficulty_review group by 1,2,3,4 order by 1,2,3,4;
select evidence,game,prompt,mode,answers,players,mean_accuracy,review_status
from ml_private.question_difficulty_review where review_status in ('review_too_easy','review_too_hard') order by answers desc;
select game,question_key,prompt,reason,count(*) as reports,min(created_at) as first_report
from ml_private.question_reports group by 1,2,3,4 order by reports desc,first_report;
