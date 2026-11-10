export class BookContext{
 constructor({ownerUid,clock=globalThis,onState=()=>{}}={}){this.ownerUid=ownerUid;this.clock=clock;this.onState=onState;this.kind='local';this.epoch=0;this.authEpoch=0;this.auth={phase:'unconfigured',uid:null};this.timer=null;}
 emit(){this.onState(this.snapshot());}snapshot(){return {kind:this.kind,epoch:this.epoch,authEpoch:this.authEpoch,auth:{...this.auth}};}
 checking(){this.clock.clearTimeout(this.timer);this.authEpoch++;this.auth={phase:'checking',uid:null};this.emit();this.timer=this.clock.setTimeout(()=>{if(this.auth.phase==='checking'){this.auth={phase:'unknown',uid:null,slow:true};this.emit();}},10000);}
 identity(user,error=null){this.clock.clearTimeout(this.timer);this.authEpoch++;this.auth=error?{phase:'unknown',uid:null,code:error}:user?.uid===this.ownerUid?{phase:'authenticated',uid:user.uid}:user?{phase:'forbidden',uid:null}:{phase:'signed-out',uid:null};this.emit();}
 switch(kind){if(!['local','cloud'].includes(kind))throw Error('book-kind');if(kind==='cloud'&&this.auth.phase!=='authenticated')throw Error('auth-unknown');if(this.kind!==kind){this.kind=kind;this.epoch++;this.emit();}return this.snapshot();}
 capture({id=null,baseRev=0}={}){if(this.kind==='cloud'&&this.auth.phase!=='authenticated')throw Error('auth-unknown');return Object.freeze({kind:this.kind,uid:this.kind==='cloud'?this.auth.uid:null,epoch:this.epoch,id,baseRev});}
 assertEdit(edit){if(edit.kind!==this.kind||edit.epoch!==this.epoch)throw Error('book-changed');if(edit.kind==='cloud'&&(this.auth.phase!=='authenticated'||edit.uid!==this.auth.uid||edit.uid!==this.ownerUid))throw Error('auth-unknown');return true;}
 operation(edit){this.assertEdit(edit);return Object.freeze({...edit,authEpoch:this.authEpoch});}
 current(operation){try{this.assertEdit(operation);return operation.kind==='local'||operation.authEpoch===this.authEpoch;}catch{return false;}}
 dispose(){this.clock.clearTimeout(this.timer);this.epoch++;this.authEpoch++;}
}
